(() => {
  'use strict';
  const dialog = document.createElement('dialog');
  dialog.id = 'social-upload';
  dialog.className = 'social-upload';
  dialog.setAttribute('aria-labelledby','social-upload-title');
  dialog.innerHTML = '<div class="upload-head"><div><div class="upload-eyebrow">Share the concept</div><h2 id="social-upload-title"></h2></div><button type="button" class="upload-close" aria-label="Close sharing instructions">×</button></div><p id="upload-media-name"></p><p id="upload-instructions"></p><div class="upload-actions"><a id="upload-download" class="btn dark" download>1. Download video ↓</a><button id="upload-copy" class="btn paper" type="button" data-upload-action="copy-caption">2. Copy caption</button><a id="upload-open" class="btn paper" target="_blank" rel="noopener noreferrer" data-upload-action="open-platform">3. Open platform ↗</a></div><label for="upload-caption">Suggested caption — edit before publishing</label><textarea id="upload-caption" rows="6" readonly></textarea><div class="upload-file-actions"><button id="upload-prepare" class="btn paper" type="button" data-upload-action="prepare-file">Prepare video for phone sharing</button><button id="upload-file" class="btn dark" type="button" data-upload-action="share-file" disabled>Share video file…</button></div><p id="upload-status" role="status" aria-live="polite"></p><p class="upload-footnote">You choose the app, account, caption and visibility. Nothing is uploaded or published automatically. Phone sharing depends on your browser and installed apps; otherwise use the download steps above.</p>';
  document.body.append(dialog);
  const $ = id => document.getElementById(id);
  const close = () => dialog.close();
  dialog.querySelector('.upload-close').addEventListener('click',close);
  let selected = null, preparedFile = null, controller = null;
  dialog.addEventListener('close',()=>{if(controller)controller.abort();controller=null;preparedFile=null;});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  const mediaIds = ['presentation','amenities','access','ai'];
  const names = ['Community platform — full presentation','Amenities & booking','Smart access & safety','AI that helps people act'];
  function open(platform,index,video) {
    if(controller)controller.abort();controller=null;preparedFile=null;
    const source = video.querySelector('source');if(!source)return;
    selected={platform,index,url:source.src,name:names[index]};
    dialog.dataset.media=mediaIds[index];dialog.dataset.platform=platform;
    $('social-upload-title').textContent=platform==='instagram'?'Share on Instagram':'Share on YouTube';
    $('upload-media-name').textContent=names[index]+(index?' · 24-second vertical reel':' · 2:32 landscape presentation');
    $('upload-instructions').textContent=platform==='instagram'?'Download this video and copy the caption. In Instagram, create a Reel or post, select the saved video, review the caption and publish when ready. The vertical reels are designed for a full-screen mobile format.':'Download this video and copy the caption. In YouTube Studio, choose Create → Upload videos, select the saved file, then review the title, description and visibility before publishing. You can also upload using the YouTube mobile app.';
    const link=new URL('https://abdulrahmaniq7.github.io/abdulrahmaniq7/');link.search='';link.searchParams.set('watch',mediaIds[index]);link.hash='watch-'+mediaIds[index];
    $('upload-caption').value=names[index]+' — a proposed AI-powered community platform concept by Abdul Rehaman A.\n\nExplore facilities, security, smart access and AI-assisted operations. Open to pilot discussions.\n\nWatch and connect: '+link.href+'\n\n#CommunityManagement #PropTech #SoftwareDevelopment'+(platform==='youtube'&&index?' #Shorts':'');
    $('upload-download').href=source.src;
    $('upload-open').href=platform==='instagram'?'https://www.instagram.com/':'https://studio.youtube.com/';
    $('upload-open').textContent=platform==='instagram'?'3. Open Instagram ↗':'3. Open YouTube Studio ↗';
    $('upload-status').textContent='';
    const supports=!!(navigator.share&&navigator.canShare&&window.File);
    $('upload-prepare').hidden=!supports;$('upload-file').hidden=!supports;$('upload-file').disabled=true;$('upload-prepare').disabled=false;
    if(!supports)$('upload-status').textContent='File sharing is unavailable in this browser. Download the video and upload it in your chosen app.';
    dialog.showModal();
  }
  document.querySelectorAll('#films .media-share').forEach((block,index)=>{
    const video=document.querySelectorAll('#films video')[index];if(!video||index>3)return;
    const actions=block.querySelector('.share-actions');
    for(const [platform,name] of [['instagram','Instagram'],['youtube','YouTube']]){
      const button=document.createElement('button');button.type='button';button.textContent=name;button.dataset.sharePlatform=platform;
      button.setAttribute('aria-label','Share '+names[index]+' on '+name);
      button.addEventListener('click',()=>open(platform,index,video));actions.append(button);
    }
    const help=block.querySelector('.share-help');if(help)help.textContent='Share a video link, or choose Instagram / YouTube for video download, caption and upload options.';
  });
  $('upload-copy').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText($('upload-caption').value);$('upload-status').textContent='Caption copied. Review it in your chosen app before publishing.';}
    catch{$('upload-caption').focus();$('upload-caption').select();$('upload-status').textContent='Caption selected — copy it using your device’s copy command.';}
  });
  $('upload-prepare').addEventListener('click',async()=>{
    if(!selected)return;const media=selected;
    $('upload-prepare').disabled=true;$('upload-status').textContent='Preparing the selected video…';
    controller=new AbortController();
    try{
      const response=await fetch(media.url,{signal:controller.signal});if(!response.ok)throw Error('Video unavailable');
      const blob=await response.blob();const file=new File([blob],mediaIds[media.index]+'.mp4',{type:'video/mp4'});
      if(!dialog.open||selected!==media)return;
      if(!navigator.canShare({files:[file]}))throw Error('File sharing unsupported');
      preparedFile=file;$('upload-file').disabled=false;$('upload-status').textContent='Video ready. Tap “Share video file…” and choose an available app. Copy the caption separately if the app does not include it.';
    }catch(error){if(error.name!=='AbortError')$('upload-status').textContent='This video could not be prepared for file sharing. Use Download video and upload it manually.';}
    finally{if(dialog.open)$('upload-prepare').disabled=false;}
  });
  // A separate user click preserves the activation required by native file sharing.
  $('upload-file').addEventListener('click',async()=>{
    if(!preparedFile)return;
    try{await navigator.share({files:[preparedFile]});$('upload-status').textContent='Returned from device sharing. Check the selected app to finish your post.';}
    catch(error){$('upload-status').textContent=error.name==='AbortError'?'Sharing cancelled. You can try again or download the video.':'Device sharing is unavailable. Download the video and upload it in your app.';}
  });
})();
