document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // event handler for clicking submit on form to run send_mail function
  document.querySelector('#compose-form').addEventListener('submit', send_mail)

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-details').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id){
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emails-details').style.display = 'block';
    // display email content
    document.querySelector('#emails-details').innerHTML = `
    <ul class="list-group mb-1">
      <li class=list-group-item><strong>From</strong>: ${email.sender}</li>
      <li class=list-group-item><strong>To</strong>: ${email.recipients}</li>
      <li class=list-group-item><strong>Subject</strong>: ${email.subject}</li>
      <li class=list-group-item><strong>Timestamp</strong>: ${email.timestamp}</li>
      <li class=list-group-item><strong>Body</strong>: ${email.body}</li>
    </ul> 
    `  
    // mark emails as read when clicked
    if (!email.read){
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }
    //reply to emails
    const reply_button = document.createElement('button');
    reply_button.innerHTML = "Reply";
    reply_button.className = "btn btn-primary mr-1";
    document.querySelector('#emails-details').append(reply_button);
    reply_button.addEventListener('click', function() {
      compose_email();
      document.querySelector('#compose-recipients').value = email.sender;
      let subject = email.subject
      if(subject.split(' ', 1)[0] != "Re:"){
        subject = "Re: " + email.subject
      }
      document.querySelector('#compose-subject').value = subject;
      document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: "${email.body}"`;
    });

    //archive or unarchive emails 
    const archive_button = document.createElement('button');
    archive_button.innerHTML = email.archived ? "Unarchive Email" : "Archive Email";
    archive_button.className = email.archived ? "btn btn-secondary" : "btn btn-danger";
    archive_button.addEventListener('click', function() {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !email.archived
        })
      })
      load_mailbox('inbox')
    });
    // don't show archive button on sent emails 
    if(mailbox !== "sent") {
      document.querySelector('#emails-details').append(archive_button);
    }
  });    
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-details').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch emails based on link clicked and user who is logged in.
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // loop over emails in db and create a div for each email  
    emails.forEach(email => {
      const new_email = document.createElement('div');
      // add class to email innerHTML and check if read/unread for bg color
      new_email.className = email.read ? 'email-list read-email' : 'email-list unread-email'
      new_email.innerHTML = `
        <div>
        <h4>From: ${email.sender}</h4>
        <span>Time: ${email.timestamp}</span><br>
        <span>Body: ${email.body}</span>
        </div>`;      
      new_email.addEventListener('click', function(){
        view_email(email.id)
      });
      document.querySelector('#emails-view').append(new_email);
    })
});
}

function send_mail(event) {
  event.preventDefault()

  // save form fields as variables
  const recipients = document.querySelector('#compose-recipients').value 
  const subject = document.querySelector('#compose-subject').value 
  const body = document.querySelector('#compose-body').value

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // run load_mailbox function to display 'sent'
      console.log(result)
      load_mailbox('sent');
  });
}

