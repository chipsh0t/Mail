document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', ()=>compose_email());
  
  // By default, load the inbox
  load_mailbox('inbox');

  //adding function to send mail
  const form = document.querySelector('#compose-form');
  form.addEventListener('submit',(e)=>{
    //prevent default submission
    e.preventDefault();
    const subject_val = document.querySelector('#compose-subject').value;
    const body_val = document.querySelector('#compose-body').value;
    const recipients_val = document.querySelector('#compose-recipients').value;
    fetch('/emails',{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        recipients: `${recipients_val}`,
        subject: `${subject_val}`,
        body: `${body_val}`
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result["error"] != undefined){
        //status 400 (bad request!)
        //checking statuses for result
        let display_res=document.createElement('div');
        display_res.className='alert alert-danger';
        display_res.innerHTML=`<h6>${result["error"]}</h6>`;
        document.querySelector('#compose-view').prepend(display_res);
        //message is shown for five seconds
        setTimeout(()=>{
          display_res.style.display='none';
        },5000);
      }else{
        //if response status is 201 (Created!)
        load_mailbox('sent');
      }
    })
    .catch(error => {
      alert("Error: ",error);
    })
  });
});

function compose_email(recipients_initial='', subject_initial='', body_initial='') {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#single-email').style.display='none';
  document.querySelector('#compose-view').style.display = 'block';
  
  //checking if it is a new mail or it is a reply to an old one !
  if(subject_initial !== '' && !(subject_initial.startsWith('Re:') || subject_initial.startsWith('re:'))){
    subject_initial = "Re: "+subject_initial;
  }
  
  //fill compose boxes
  document.querySelector('#compose-recipients').value = recipients_initial;
  document.querySelector('#compose-subject').value = subject_initial;
  document.querySelector('#compose-body').value = body_initial;
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#single-email').style.display='none';
  document.querySelector('#compose-view').style.display = 'none';
  // document.querySelector('#sigle-email').style.display='none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  //`/emails/${mailbox}`
  //loading different mailbox views (inbox, sent, archive)
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    if (emails.length === 0){
      let display_letter = document.createElement('div');
      display_letter.className='alert alert-warning';
      display_letter.innerHTML=`<h5>It looks like your ${mailbox} mailbox is empty!</h5>`;
      document.querySelector('#emails-view').append(display_letter);
    }else{
      for(let i=0; i<emails.length; i++){
        let display_letter = document.createElement('div');
        display_letter.id = 'notification';
        let email = emails[i];
        display_letter.innerHTML=`<h5>${email.sender}</h5>
                                  <p>${email.subject}</p> 
                                  <p>${email.timestamp}</p>`;
        //choosing background color for email
        if (email["read"]){
          display_letter.style.backgroundColor='grey';
        }else{
          display_letter.style.backgroundColor='white';
        }
        display_letter.addEventListener('click',()=>view_email(email.id));
        document.querySelector('#emails-view').append(display_letter);
      }
    }
  })
  .catch(error => {
    alert(error);
  })
}


function view_email(id){
  //viewing a single email
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email').style.display='block';
  //fetching email data
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    if(email!=undefined){
      let single_email = document.querySelector('#single-email');
      single_email.innerHTML=`<p>From: ${email.sender}<p>
                              <p>To: ${email.recipients}</p> 
                              <p>Subject: ${email.subject}</p>
                              <p>Timestamp: ${email.timestamp}</p>
                              <hr>
                              <p>${email.body}<p>
                              <button type="button" class="btn btn-primary" id="archive-unarchive"></button>
                              <button type="button" class="btn btn-primary" id="replay-button">Replay</button>`;
      
      //creating archive-unarchive button
      let button = single_email.querySelector('#archive-unarchive');
      if (email["archived"]){   
        button.innerHTML='Unarchive';
        button.addEventListener('click',()=>archive_unarchive(id,false));
      }else{
        button.innerHTML='Archive';
        button.addEventListener('click',()=>archive_unarchive(id,true));
      }

      //creating replay button
      let replay = single_email.querySelector('#replay-button');
      replay.addEventListener('click',()=>compose_email(recipients_initial=email.sender, subject_initial = email.subject, body_initial=`On ${email.timestamp} ${email.sender} wrote: ${email.body}`));
    }
  })
  .catch(error => {
    alert(error);
  })
  
  //after clicking the email read value should become true
  fetch(`/emails/${id}`,{
    method:'PUT',
    headers:{
      'Content-Type':'application/json'
    },
    body:JSON.stringify({
      read:true
    })
  })
  .catch(error => {
    alert(error);
  })
}

//archive and unarchive your emails
function archive_unarchive(id,value){
  fetch(`/emails/${id}`,{
    method:'PUT',
    body:JSON.stringify({
      archived:value
    })
  })
  .then(()=>load_mailbox('inbox'))
  .catch(error => {
    alert(error);
  })
}

