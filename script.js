// 1. CONFIGURATION INITIALE (CORRIGÉE AVEC HTTPS)
const SUPABASE_URL = 'supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_bVPliN88Myt9GWbJH02seQ_0tTccRs2'; 
let supabaseClient;

// 2. NAVIGATION
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    
    const targetSection = document.getElementById(id);
    if(targetSection) targetSection.classList.add('active');
    
    const targetBtn = document.getElementById('btn-' + id);
    if(targetBtn) targetBtn.classList.add('active');
}

// 3. INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        refreshUI();
    } else {
        console.error("Erreur critique : Le module de connexion Supabase n'est pas accessible.");
    }

    const form = document.getElementById('pointsForm');
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            ajouterNote();
        });
    }
});

// 4. ACTIONS DE CRÉATION SUR LA BASE DE DONNÉES
async function ajouterPromotion() {
    const input = document.getElementById('newPromoInputName');
    if (!input || !input.value.trim()) return alert("Veuillez saisir un nom de promotion.");

    const { error } = await supabaseClient.from('promotions').insert([{ name: input.value.trim() }]);
    if(error) {
        alert("Erreur d'insertion : " + error.message);
    } else {
        input.value = '';
        refreshUI();
    }
}

async function ajouterCours() {
    const nom = document.getElementById('newCourseInput').value.trim();
    const prof = document.getElementById('newProfInput').value.trim();
    const promo = document.getElementById('selectPromoForCourse').value;

    if (!nom || !prof || !promo) return alert("Veuillez remplir tous les champs du cours.");

    const { error } = await supabaseClient.from('courses').insert([{ nom, prof, promo }]);
    if(error) {
        alert("Erreur d'insertion : " + error.message);
    } else {
        document.getElementById('newCourseInput').value = '';
        document.getElementById('newProfInput').value = '';
        refreshUI();
    }
}

async function inscrireEtudiant() {
    const nom = document.getElementById('newStudentName').value.trim();
    const classe = document.getElementById('selectPromoForStudent').value;

    if (!nom || !classe) return alert("Veuillez renseigner le nom et la promotion.");

    const { error } = await supabaseClient.from('students').insert([{ nom, classe }]);
    if(error) {
        alert("Erreur d'insertion : " + error.message);
    } else {
        document.getElementById('newStudentName').value = '';
        refreshUI();
    }
}

async function ajouterNote() {
    const sid = document.getElementById('selectStudent').value;
    const cours = document.getElementById('selectCourse').value;
    const pts = document.getElementById('pointsInput').value;

    if(!sid || !cours || !pts) return alert("Champs de saisie incomplets.");
    
    const pointsNum = parseFloat(pts);
    if(pointsNum < 0 || pointsNum > 100) return alert("La note doit obligatoirement être comprise entre 0 et 100.");

    const { error } = await supabaseClient.from('notes').insert([{ 
        student_id: parseInt(sid), 
        cours: cours, 
        points: pointsNum 
    }]);

    if(error) {
        alert("Erreur d'insertion : " + error.message);
    } else {
        document.getElementById('pointsInput').value = '';
        refreshUI();
    }
}

// 5. CHARGEMENT ET SYNC DYNAMIQUE DES INTERFACES
async function refreshUI() {
    if(!supabaseClient) return;

    // Charger les promotions
    const { data: promos } = await supabaseClient.from('promotions').select('*');
    if(promos) {
        const html = promos.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
        const selectStudent = document.getElementById('selectPromoForStudent');
        const selectCourse = document.getElementById('selectPromoForCourse');
        const listDisplay = document.getElementById('listPromosDisplay');

        if(selectStudent) selectStudent.innerHTML = html;
        if(selectCourse) selectCourse.innerHTML = html;
        if(listDisplay) listDisplay.innerHTML = promos.map(p => `<li>${p.name}</li>`).join('');
    }

    // Charger les étudiants
    const { data: students } = await supabaseClient.from('students').select('*');
    if(students) {
        const tableBody = document.getElementById('listInscritsTable');
        if(tableBody) {
            tableBody.innerHTML = students.map(s => 
                `<tr>
                    <td>${s.id}</td>
                    <td>${s.nom}</td>
                    <td>${s.classe}</td>
                    <td><button onclick="deleteRow('students', ${s.id})">Supprimer</button></td>
                 </tr>`
            ).join('');
        }

        const optStd = students.map(s => `<option value="${s.id}">${s.nom}</option>`).join('');
        const selectStudentNote = document.getElementById('selectStudent');
        const studentSelectView = document.getElementById('studentSelectView');

        if(selectStudentNote) selectStudentNote.innerHTML = '<option value="">-- Étudiant --</option>' + optStd;
        if(studentSelectView) studentSelectView.innerHTML = '<option value="">-- Qui êtes-vous ? --</option>' + optStd;
    }

    // Charger la liste globale des notes pour le panneau d'administration
    const { data: globalNotes } = await supabaseClient.from('notes').select('id, cours, points, students(nom)');
    const mainPointsTable = document.getElementById('mainPointsTable');
    if(mainPointsTable && globalNotes) {
        mainPointsTable.innerHTML = globalNotes.map(n => 
            `<tr>
                <td>${n.id}</td>
                <td>${n.students ? n.students.nom : 'Inconnu'}</td>
                <td>${n.cours}</td>
                <td>${n.points}/100</td>
             </tr>`
        ).join('');
    }
}

// FILTRAGE LOGIQUE DES COURS SELON LA CLASSE
async function filtrerCoursParPromo() {
    const id = document.getElementById('selectStudent').value;
    const sel = document.getElementById('selectCourse');
    if (!id) {
        if(sel) { sel.innerHTML = '<option value="">-- Cours --</option>'; sel.disabled = true; }
        return; 
    }
    
    const { data: std } = await supabaseClient.from('students').select('classe').eq('id', parseInt(id)).single();
    if(std) {
        const { data: crs = [] } = await supabaseClient.from('courses').eq('promo', std.classe);
        if(sel) {
            sel.disabled = false;
            sel.innerHTML = crs && crs.length > 0 ? crs.map(c => `<option value="${c.nom}">${c.nom}</option>`).join('') : '<option value="">Aucun cours disponible</option>';
        }
    }
}

// 6. ESPACE ÉTUDIANT (BULLETIN ET MOYENNE GENERALE)
async function calculerBulletin() {
    const studentId = document.getElementById('studentSelectView').value;
    const banner = document.getElementById('studentInfoBanner');
    const tableBody = document.getElementById('bulletinBody');
    const moyenneDisplay = document.getElementById('moyenneDisplay');

    if (!studentId) {
        if(banner) banner.innerHTML = '';
        if(tableBody) tableBody.innerHTML = '';
        if(moyenneDisplay) moyenneDisplay.innerHTML = '0%';
        return;
    }

    const { data: student } = await supabaseClient.from('students').select('*').eq('id', parseInt(studentId)).single();
    if(student) {
        if(banner) banner.innerHTML = `<strong>Nom :</strong> ${student.nom} | <strong>Promotion :</strong> ${student.classe}`;
        
        const { data: notes } = await supabaseClient.from('notes').select('*').eq('student_id', student.id);
        if(notes && notes.length > 0) {
            let totalPoints = 0;
            if(tableBody) {
                tableBody.innerHTML = notes.map(n => {
                    totalPoints += parseFloat(n.points);
                    const statut = n.points >= 50 ? '<span style="color:green; font-weight:bold;">Validé</span>' : '<span style="color:red; font-weight:bold;">Ajourné</span>';
                    return `<tr><td>${n.cours}</td><td>${n.points} / 100</td><td>${statut}</td></tr>`;
                }).join('');
            }

            const moyenne = totalPoints / notes.length;
            if(moyenneDisplay) {
                moyenneDisplay.innerHTML = `${moyenne.toFixed(1)}%`;
                moyenneDisplay.style.color = moyenne >= 50 ? 'green' : 'red';
            }
        } else {
            if(tableBody) tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Aucune note publiée.</td></tr>';
            if(moyenneDisplay) moyenneDisplay.innerHTML = '0%';
        }
    }
}

// SUPPRESSION AVEC CONVERTISSEUR ENTIER
async function deleteRow(table, id) {
    if(confirm("Confirmer la suppression définitive ?")) {
        const { error } = await supabaseClient.from(table).delete().eq('id', parseInt(id));
        if(error) alert("Action impossible : " + error.message);
        else refreshUI();
    }
}
