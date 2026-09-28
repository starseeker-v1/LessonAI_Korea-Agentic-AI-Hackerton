(function(){
  const STATUSES = ['draft', 'approved'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const array = value => Array.isArray(value) ? value : [];
  const localBackendDemo = () => { try { return new URLSearchParams(window.location.search).get('backendDemo') === '1'; } catch { return false; } };

  function validateDraft(draft){
    const errors=[];
    if(!draft || typeof draft.studentId!=='string' || !draft.studentId) errors.push('studentId');
    if(!draft || typeof draft.lessonDate!=='string' || !draft.lessonDate) errors.push('lessonDate');
    if(!draft || typeof draft.summary!=='string') errors.push('summary');
    if(!draft || !draft.source || draft.source.type!=='recording') errors.push('source');
    ['repertoire','strengths','improvements','progressSinceLastLesson','practiceTasks'].forEach(key=>{
      if(!draft || !Array.isArray(draft[key])) errors.push(key);
    });
    if(!draft || !STATUSES.includes(draft.status)) errors.push('status');
    return {valid:errors.length===0,errors};
  }

  function createDraft(input){
    const draft={
      studentId: input.studentId,
      studentUuid: input.studentUuid || input.studentId,
      studentName: input.studentName || '',
      lessonDate: input.lessonDate,
      source: {type:'recording',retention:'temporary-until-review'},
      summary: input.summary || '',
      repertoire: array(input.repertoire),
      strengths: array(input.strengths),
      improvements: array(input.improvements).concat(array(input.recurringIssues)),
      progressSinceLastLesson: array(input.progressSinceLastLesson),
      practiceTasks: array(input.practiceTasks).concat(array(input.nextLessonChecks).map(item=>typeof item==='string'?{task:item,priority:'medium',target:'다음 레슨 전'}:item)),
      status:'draft'
    };
    const result=validateDraft(draft);
    if(!result.valid) throw new Error('잘못된 레슨 일지: '+result.errors.join(', '));
    return draft;
  }

  function approveDraft(draft, editedFields){
    const next=Object.assign({},clone(draft),editedFields||{}, {status:'approved'});
    const result=validateDraft(next);
    if(!result.valid) throw new Error('승인할 수 없는 레슨 일지: '+result.errors.join(', '));
    return next;
  }

  function toLessonRecord(draft){
    if(!draft || draft.status!=='approved') return null;
    return {
      id:'lesson-agent-'+draft.studentId+'-'+draft.lessonDate,
      studentId:draft.studentId,
      date:draft.lessonDate,
      summary:draft.summary,
      journal:draft,
      approved:true,
      source:'lesson-agent'
    };
  }

  function startSession(input){
    return {
      id:'agent-session-'+Date.now(),
      studentId:input.studentId,
      studentUuid:input.studentUuid || input.studentId,
      studentName:input.studentName||'',
      lessonDate:input.lessonDate,
      previousLessons:array(input.previousLessons),
      transcriptHint:input.transcript||'',
      status:'recording',
      durationSeconds:0,
      audioRetention:'temporary'
    };
  }

  function stopSession(session, details){
    const next=Object.assign({},session,details||{});
    if(!next.durationSeconds){return Object.assign(next,{status:'error',error:'녹음 내용이 없습니다. 다시 녹음해 주세요.'});}
    return Object.assign(next,{status:'analyzing'});
  }

  function getComparison(previousLessons){
    if(!previousLessons || !previousLessons.length) return {label:'첫 레슨',items:[]};
    return {label:'지난 레슨 대비',items:[previousLessons[0].summary || '이전 레슨 기록을 확인했어요.']};
  }

  function demoAnalysis(input, session){
    const comparison=getComparison(session.previousLessons);
    const hasProgress=comparison.label!=='첫 레슨';
    return createDraft({
      studentId:session.studentId,
      studentUuid:session.studentUuid || session.studentId,
      studentName:session.studentName,
      lessonDate:session.lessonDate,
      summary:'오늘은 쇼팽 왈츠 3쪽을 중심으로 왼손 반주와 페달 교체를 점검했습니다.',
      repertoire:[{title:'쇼팽 왈츠',section:'3쪽',notes:'왼손 반주와 페달 교체 점검'}],
      strengths:['왼손 반주 패턴이 지난 레슨보다 안정적입니다.'],
      improvements:['프레이즈 끝에서 페달을 조금 더 빠르게 교체해 주세요.','프레이즈 끝 페달 교체 타이밍'],
      progressSinceLastLesson:hasProgress?['왼손 반주가 이전 레슨보다 안정되었습니다.']:['첫 레슨이라 비교할 이전 기록이 없습니다.'],
      practiceTasks:[{task:'3쪽을 느린 템포로 연습하며 페달 교체 표시하기',priority:'high',target:'다음 레슨 전'},{task:'3쪽 페달 교체와 프레이즈 연결 확인',priority:'medium',target:'다음 레슨 전'}]
    });
  }

  function analyzeSession(session, adapter){
    if(!session || session.status!=='analyzing') return Promise.reject(new Error('분석할 수 없는 세션입니다.'));
    const run=adapter&&adapter.analyze ? adapter.analyze : function(input){return demoAnalysis(input,session)};
    return Promise.resolve(run({studentId:session.studentId,studentUuid:session.studentUuid || session.studentId,studentName:session.studentName,lessonDate:session.lessonDate},session))
      .then(draft=>Object.assign({},session,{draft:createDraft(Object.assign({},draft,{studentId:draft.studentId||session.studentId,studentUuid:draft.studentUuid||session.studentUuid||session.studentId,studentName:draft.studentName||session.studentName,lessonDate:draft.lessonDate||session.lessonDate})),status:'draft',audioRetention:'temporary-until-review',transcriptHint:undefined}));
  }

  function deleteAudio(session){return Object.assign({},session,{audioRetention:'deleted-after-analysis',transcriptHint:undefined});}

  function createBrowserRecorder(options){
    options=options||{};
    const mediaDevices=options.mediaDevices||(typeof navigator!=='undefined'?navigator.mediaDevices:null);
    const MediaRecorderImpl=options.MediaRecorderImpl||(typeof window!=='undefined'?window.MediaRecorder:null);
    let stream=null,recorder=null,chunks=[];
    function mimeType(){
      const candidates=['audio/ogg;codecs=opus','audio/opus'];
      return candidates.find(type=>MediaRecorderImpl&&MediaRecorderImpl.isTypeSupported&&MediaRecorderImpl.isTypeSupported(type))||'';
    }
    return {
      async start(){
        if(!mediaDevices||!mediaDevices.getUserMedia) throw new Error('마이크 권한을 사용할 수 없습니다.');
        if(!MediaRecorderImpl) throw new Error('이 브라우저는 음성 녹음을 지원하지 않습니다.');
        stream=await mediaDevices.getUserMedia({audio:true});
        chunks=[];
        const type=mimeType();
        if(!type){stream.getTracks().forEach(track=>track.stop());stream=null;throw new Error('NVIDIA Speech NIM이 받는 OGG/OPUS 녹음 형식을 지원하지 않는 브라우저입니다.');}
        recorder=new MediaRecorderImpl(stream,{mimeType:type});
        recorder.ondataavailable=event=>{if(event.data&&event.data.size)chunks.push(event.data);};
        recorder.start();
        return {mimeType:recorder.mimeType||type};
      },
      pause(){if(recorder&&recorder.state==='recording')recorder.pause();},
      resume(){if(recorder&&recorder.state==='paused')recorder.resume();},
      stop(){
        return new Promise((resolve,reject)=>{
          if(!recorder||recorder.state==='inactive') return reject(new Error('녹음 중인 세션이 없습니다.'));
          recorder.onerror=()=>reject(new Error('음성 녹음에 실패했습니다.'));
          recorder.onstop=()=>{
            const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});
            if(stream) stream.getTracks().forEach(track=>track.stop());
            stream=null;recorder=null;chunks=[];
            if(!blob.size) return reject(new Error('녹음 내용이 없습니다.'));
            resolve(blob);
          };
          recorder.stop();
        });
      }
    };
  }

  function createDemoRecorder(){
    let recording=false,paused=false;
    return {
      async start(){recording=true;return {mimeType:'audio/opus',demo:true};},
      pause(){if(recording)paused=true;},
      resume(){if(recording)paused=false;},
      async stop(){
        if(!recording) throw new Error('녹음 중인 데모 세션이 없습니다.');
        recording=false;
        return new Blob([new Uint8Array([80,79,67,79])],{type:'audio/opus'});
      }
    };
  }

  const RemoteAnalysisAdapter={analyze:function(input,session){
    const endpoint=(window.LESSON_AGENT_API_URL||'/api/lesson-agent/analyze');
    return fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentUuid:input.studentUuid||input.studentId,lessonDate:input.lessonDate,transcript:session.transcriptHint,previousLessons:session.previousLessons})})
      .then(response=>response.json().then(body=>{if(!response.ok)throw new Error(body.error||'레슨 에이전트 서버 요청에 실패했습니다.');return body.draft;}));
  }};
  const RemoteTranscriptionAdapter={transcribe:function(blob,options){
    options=options||{};
    const endpoint=(window.LESSON_AGENT_TRANSCRIBE_URL||'/api/lesson-agent/transcribe');
    const form=new FormData();
    const type=blob.type||'audio/opus';
    const extension=type.includes('webm')?'webm':type.includes('ogg')?'ogg':'opus';
    form.append('language','ko-KR');
    form.append('audioEnhancement',options.enhance?'on':'off');
    form.append('file',blob,'lesson.'+extension);
    return fetch(endpoint,{method:'POST',body:form})
      .then(response=>response.json().then(body=>{if(!response.ok)throw new Error(body.error||'음성 인식 서버 요청에 실패했습니다.');return body.transcript;}));
  }};
  const DemoAudioEnhancementAdapter={enhance:function(blob){return Promise.resolve(blob)}};
  const RemoteAudioEnhancementAdapter={enhance:function(blob){
    const endpoint=(window.LESSON_AGENT_ENHANCE_URL||'/api/lesson-agent/enhance');
    const form=new FormData();form.append('file',blob,'lesson.'+((blob.type||'audio/opus').includes('webm')?'webm':'opus'));form.append('enhancement','noise-reduction-and-voice-isolation');
    return fetch(endpoint,{method:'POST',body:form}).then(response=>{if(!response.ok)throw new Error('음성 보정 서버 요청에 실패했습니다.');return response.blob()});
  }};
  const RemoteLessonRepository={
    config:function(){
      const demo=localBackendDemo();
      const base=String(window.LESSON_AGENT_BACKEND_URL||(demo?'http://localhost:8788':'')).replace(/\/$/,'');
      return {base,teacherId:window.LESSON_AGENT_TEACHER_ID||(demo?'teacher-a':''),studioId:window.LESSON_AGENT_STUDIO_ID||(demo?'studio-a':'')};
    },
    isConfigured:function(){const config=this.config();return Boolean(config.base&&config.teacherId&&config.studioId);},
    headers:function(config,includeJson){const headers={'X-Teacher-Id':config.teacherId,'X-Studio-Id':config.studioId};if(includeJson)headers['Content-Type']='application/json';return headers;},
    request:function(url,options,errorMessage){return fetch(url,options).then(response=>response.json().catch(()=>({})).then(body=>{if(!response.ok)throw new Error(body.error&&body.error.message||body.error||errorMessage);return body;}));},
    getPreviousLessons:function(input){
      const config=this.config();
      if(!this.isConfigured()) return Promise.resolve([]);
      const url=config.base+'/api/students/'+encodeURIComponent(input.studentUuid)+'/lesson-records?limit=10';
      return this.request(url,{headers:this.headers(config,false)},'이전 레슨 기록을 불러오지 못했습니다.').then(body=>body.items||[]);
    },
    saveApprovedLesson:function(input){
      const config=this.config();
      if(!this.isConfigured()) return Promise.resolve({localOnly:true});
      const draft=Object.assign({},input.draft);
      delete draft.studentName;
      delete draft.studentId;
      const url=config.base+'/api/students/'+encodeURIComponent(input.studentUuid)+'/lesson-records';
      return this.request(url,{method:'POST',headers:this.headers(config,true),body:JSON.stringify({studentUuid:input.studentUuid,lessonDate:input.lessonDate,draft,approvedBy:config.teacherId})},'승인된 레슨 기록을 저장하지 못했습니다.');
    }
  };
  const DemoTranscriptionAdapter={transcribe:async function(){return '오늘은 쇼팽 왈츠 3쪽을 연습했고 왼손 반주와 페달 교체를 점검했습니다. 다음 레슨에서 프레이즈 연결을 확인합니다.';}};
  window.LessonAgent={STATUSES,validateDraft,createDraft,approveDraft,toLessonRecord,startSession,stopSession,analyzeSession,getComparison,deleteAudio,createBrowserRecorder,createDemoRecorder,DemoAnalysisAdapter:{analyze:function(input,session){return demoAnalysis(input,session)}},DemoTranscriptionAdapter,DemoAudioEnhancementAdapter,RemoteAnalysisAdapter,RemoteTranscriptionAdapter,RemoteAudioEnhancementAdapter,RemoteLessonRepository};
})();
