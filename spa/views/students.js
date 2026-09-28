(function(){
  const fields=[
    ['summary','수업 전체 요약','레슨 내용을 한눈에 정리해요.'],
    ['repertoire','곡·구간','오늘 다룬 곡과 구간을 기록해요.'],
    ['strengths','잘된 점','학생이 잘 해낸 점을 기록해요.'],
    ['improvements','개선할 점','추가로 살펴볼 점과 반복되는 문제를 기록해요.'],
    ['progressSinceLastLesson','지난 레슨보다 좋아진 점','이전 레슨과 비교한 변화를 기록해요.'],
    ['practiceTasks','다음 연습 과제','다음 레슨 전 연습하고 확인할 내용을 기록해요.']
  ];
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function render(subview){
    const [studentId,, ,recordId]=String(subview||'doyoon/lessons/record/8').split('/');
    const student=PocoState.students.find(item=>item.id===studentId)||PocoState.students[0];
    const records=PocoState.getStudentLessonRecords(student.id),index=records.findIndex(item=>item.id===String(recordId)),record=records[index];
    if(!record)return '<section class="view lesson-record-view"><section class="panel"><h1>레슨 기록을 찾을 수 없어요.</h1></section></section>';
    const draft=PocoState.lessonRecordDraftFor(student.id,record.id)||record;
    const fieldMarkup=fields.map(([name,label,hint])=>`<label class="lesson-record-field"><span>${label}</span><textarea name="${name}" rows="3" placeholder="${hint}">${esc(record.approved?draft[name]:'')}</textarea></label>`).join('');
    const memo=`<label class="lesson-record-field lesson-record-memo"><span>선생님 메모</span><textarea name="memo" rows="3" placeholder="선생님만 참고할 내용을 기록해요.">${esc(record.approved?draft.memo:'')}</textarea></label>`;
    const status=record.approved?'검토 완료':'검토 필요';
    return `<section class="view students-view lesson-record-view"><div class="page-heading"><div><p class="eyebrow">학생 관리 · ${esc(student.name)} · 레슨 기록</p><div class="lesson-record-title"><h1>${record.session}회차 레슨 기록</h1><span class="pill ${record.approved?'review-complete':'review-needed'}">${status}</span></div><p class="muted">${PocoState.formatLessonDate(record.date)} · ${record.instrument} · ${record.duration}</p></div><button type="button" class="button primary lesson-summary-ai-button" data-lesson-summary-ai>레슨 AI로 요약하기</button></div><form class="lesson-record-form" data-lesson-record-form data-student-id="${student.id}" data-record-id="${record.id}"><section class="panel lesson-record-fields">${fieldMarkup}${memo}</section><div class="lesson-record-actions lesson-record-actions-centered"><span class="lesson-record-actions-center"><button type="button" class="button secondary" data-record-save disabled>저장하기</button><button type="button" class="button primary" data-record-review ${record.approved?'disabled':''}>검토 완료</button></span></div></form></section>`;
  }
  window.PocoViews={students:render};
})();
