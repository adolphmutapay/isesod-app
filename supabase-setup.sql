-- Crée les tables nécessaires pour le projet Adolph Student Site

create table public.promotions (
  id bigserial primary key,
  name text not null
);

create table public.courses (
  id bigserial primary key,
  nom text not null,
  prof text not null,
  promo text not null
);

create table public.students (
  id bigserial primary key,
  nom text not null,
  classe text not null
);

create table public.notes (
  id bigserial primary key,
  student_id bigint not null references public.students(id) on delete cascade,
  cours text not null,
  points numeric not null check (points >= 0 and points <= 100)
);

create index on public.notes(student_id);
