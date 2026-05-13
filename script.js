// 1. CHARGEMENT DYNAMIQUE DU SDK SUPABASE
const cdnUrl = "https" + "://" + "cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const scriptSupabase = document.createElement('script');
scriptSupabase.src = cdnUrl;
document.head.appendChild(scriptSupabase);

// 2. CONFIGURATION DE VOTRE PROJET
const SUPABASE_URL = "https" + "://" + "ibvdeuhfjeinlcvmmxof.supabase.co"; 
const SUPABASE_ANON_KEY = 'sb_publishable_bVPliN88Myt9GWbJH02seQ_0tTccRs2'; 
let supabaseClient;

// 3. NAVIGATION (Votre logique initiale)
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    
    const targetSection = document.getElementById(id);
    if(targetSection) targetSection.classList.add('active');
    
    const targetBtn = document.getElementById('btn-' + id);
    if(targetBtn) targetBtn.classList.add('active');
}

// 4. INITIALISATION AUTOMATIQUE
scriptSupabase.onload = () => {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        refreshUI();
    } else {
        console.error("Le module de connexion Supabase n'est pas accessible.");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('pointsForm');
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            ajouterNote();
        });
    }
});

// 5. VOS ACTIONS DE CRÉATION DE BASE (Intactes)
async function ajouterPromotion() {
    const input = document.getElementById('newPromoInputName');
    if (!input || !input.value.trim()) return alert("Veuillez saisir un nom de promotion.");

    const { error } = await supabaseClient.from('promotions').insert([{ name: input.value.trim() }]);
    if(error) alert(error.message);
    else { input.value = ''; refreshUI(); }
}

async function ajouterCours() {
    const nom = document.getElementById('newCourseInput').value.trim();
    const prof = document.getElementById('newProfInput').value.trim();
    const credits = document.getElementById('newCourseCredits').value; // Récupération du crédit
    const promo = document.getElementById('selectPromoForCourse').value;

    if (!nom || !prof || !promo) return alert("Veuillez remplir tous les champs du cours.");

    const { error } = await supabaseClient.from('courses').insert([{ 
        nom, 
        prof, 
        promo,
        credits: credits ? parseFloat(credits) : 1 // Enregistrement du crédit (Défaut à 1)
    }]);
    
    if(error) alert(error.message);
    else {
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
    if(error) alert(error.message);
    else { document.getElementById('newStudentName').value = ''; refreshUI(); }
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

    if(error) alert(error.message);
    else { document.getElementById('pointsInput').value = ''; refreshUI(); }
}

// 6. REFRESH ET AFFICHAGE DYNAMIQUE (Votre logique préservée)
async function refreshUI() {
    if(!supabaseClient) return;

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

function filtrerCoursParPromo() {
    const id = document.getElementById('selectStudent').value;
    const sel = document.getElementById('selectCourse');
    if (!id) {
        if(sel) { sel.innerHTML = '<option value="">-- Cours --</option>'; sel.disabled = true; }
        return; 
    }
    
    supabaseClient.from('students').select('classe').eq('id', parseInt(id)).single().then(({data: std}) => {
        if(std) {
            supabaseClient.from('courses').eq('promo', std.classe).then(({data: crs}) => {
                if(sel) {
                    sel.disabled = false;
                    sel.innerHTML = crs && crs.length > 0 ? crs.map(c => `<option value="${c.nom}">${c.nom}</option>`).join('') : '<option value="">Aucun cours disponible</option>';
                }
            });
        }
    });
}

// 7. BULLETIN AMÉLIORÉ (Moyenne Pondérée + Mentions RDC)
function calculerBulletin() {
    const studentId = document.getElementById('studentSelectView').value;
    const banner = document.getElementById('studentInfoBanner');
    const tableBody = document.getElementById('bulletinBody');
    const moyenneDisplay = document.getElementById('moyenneDisplay');
    const mentionDisplay = document.getElementById('mentionDisplay');

    if (!studentId) {
        if(banner) banner.innerHTML = '';
        if(tableBody) tableBody.innerHTML = '';
        if(moyenneDisplay) moyenneDisplay.innerHTML = '0%';
        if(mentionDisplay) mentionDisplay.innerHTML = '';
        return;
    }

    supabaseClient.from('students').select('*').eq('id', parseInt(studentId)).single().then(({data: student}) => {
        if(student) {
            if(banner) banner.innerHTML = `Étudiant : ${student.nom} | Classe : ${student.classe}`;
            
            supabaseClient.from('notes').select('*').eq('student_id', student.id).then(({data: notes}) => {
                supabaseClient.from('courses').select('nom, credits').eq('promo', student.classe).then(({data: listCourses}) => {
                    
                    if(notes && notes.length > 0 && listCourses) {
                        let totalPointsPonderes = 0;
                        let totalCredits = 0;

                        let htmlRows = notes.map(n => {
                            const coursInfo = listCourses.find(c => c.nom === n.cours);
                            const credits = coursInfo && coursInfo.credits ? parseFloat(coursInfo.credits) : 1;
                            
                            totalPointsPonderes += (parseFloat(n.points) * credits);
                            totalCredits += credits;

                            const statut = n.points >= 50 ? '<span style="color:green; font-weight:bold;">Validé</span>' : '<span style="color:red; font-weight:bold;">Ajourné</span>';
                            return `<tr><td>${n.cours}</td><td>${credits}</td><td>${n.points} / 100</td><td>${statut}</td></tr>`;
                        }).join('');

                        if(tableBody) tableBody.innerHTML = htmlRows;

                        // Calcul de la moyenne pondérée LMD
                        const moyennePondere = totalPointsPonderes / totalCredits;
                        if(moyenneDisplay) {
                            moyenneDisplay.innerHTML = `${moyennePondere.toFixed(1)}%`;
                            moyenneDisplay.style.color = moyennePondere >= 50 ? 'green' : 'red';
                        }

                        // Attribution de la mention RDC
                        let mention = "Ajourné";
                        if (moyennePondere >= 80) mention = "La Plus Grande Distinction (PGD)";
                        else if (moyennePondere >= 70) mention = "Grande Distinction (GD)";
                        else if (moyennePondere >= 60) mention = "Distinction (D)";
                        else if (moyennePondere >= 50) mention = "Satisfaction (S)";

                        if(mentionDisplay) {
                            mentionDisplay.innerHTML = `Mention : ${mention}`;
                            mentionDisplay.style.color = moyennePondere >= 50 ? '#007bff' : 'red';
                        }
                    } else {
                        if(tableBody) tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Aucune note publiée.</td></tr>';
                        if(moyenneDisplay) moyenneDisplay.innerHTML = '0%';
                        if(mentionDisplay) mentionDisplay.innerHTML = '';
                    }
                });
            });
        }
    });
}

function deleteRow(table, id) {
    if(confirm("Confirmer la suppression définitive ?")) {
        supabaseClient.from(table).delete().eq('id', parseInt(id)).then(({error}) => {
            if(error) alert("Action impossible : " + error.message);
            else refreshUI();
        });
    }
}
