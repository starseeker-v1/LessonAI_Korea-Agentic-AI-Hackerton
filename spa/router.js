(function(){
  function parseRoute(hash){
    const raw=(hash||'').replace(/^#/,'').replace(/^\//,'');
    const parts=raw.split('/');
    if(parts[0]==='students'&&parts[2]==='lessons'&&parts[3]==='agent')return {name:'lesson-agent',studentId:parts[1],recordId:parts[4]||'8'};
    if(parts[0]==='students'&&parts[2]==='lessons'&&parts[3]==='record'&&parts[4])return {name:'lesson-record',studentId:parts[1],recordId:parts[4]};
    return {name:'lesson-record',studentId:'doyoon',recordId:'8'};
  }
  window.PocoRouter={parseRoute};
})();
