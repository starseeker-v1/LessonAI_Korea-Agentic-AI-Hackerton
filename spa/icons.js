(function(){
  const svg=(body,extra='')=>`<svg class="gnb-svg ${extra}" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  window.PocoIcons={
    today:svg('<g transform="translate(0 -2)"><path d="M16 18h32v34H16z"/><path d="M22 12v8M42 12v8"/><path d="M34 27v12"/><path d="M34 27c5 0 7 1 8 5-2-2-4-3-8-3Z" fill="currentColor" stroke="none"/><ellipse cx="30" cy="40" rx="5" ry="3.5" transform="rotate(-20 30 40)" fill="currentColor" stroke="none"/></g>'),
    lessons:svg('<path d="m18 47 4-14L45 10l7 7-23 23-14 7Z"/><path d="m39 16 7 7"/>'),
    chat:svg('<path d="M14 23c0-7.7 6.3-14 14-14h10c7.7 0 14 6.3 14 14v8c0 7.7-6.3 14-14 14H27L14 53l3-10.5c-2-2.5-3-5.6-3-9.5V23Z"/><path d="M25 25h16M25 32h10"/>'),
    students:svg('<circle cx="32" cy="22" r="8"/><path d="M17 51c1-9 6-14 15-14s14 5 15 14"/>'),
    edit:svg('<path d="m46 18-8-8L13 35l-3 13 13-3 25-27Z"/><path d="m38 10 8 8M13 35l10 10"/>'),
    trash:svg('<path d="M14 18h36M25 18v-5h14v5M20 18l2 37h20l2-37M28 27v19M36 27v19"/>'),
    settings:svg('<path d="m26 8 12 0 2 8 7 4 7-3 6 10-6 5v8l6 5-6 10-7-3-7 4-2 8H26l-2-8-7-4-7 3-6-10 6-5v-8l-6-5 6-10 7 3 7-4 2-8Z"/><circle cx="32" cy="36" r="8"/>'),
    shield:svg('<path d="M32 7 51 14v15c0 12-8 21-19 28C21 50 13 41 13 29V14L32 7Z"/><path d="m23 31 6 6 12-13"/>')
  };
})();
