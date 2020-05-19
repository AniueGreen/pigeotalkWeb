const auth = firebase.auth();

function onFirebaseStateChange(){
    firebase.auth().onAuthStateChanged(onStateChanged);
}
onFirebaseStateChange();
var user;

function onStateChanged(currentUser){
    if(currentUser){
        var userId = currentUser.uid;
        const database = firebase.database().ref().child('users/'+userId);
        database.on('value',snap => {
            user = snap.val();
            getUserInformation(user);
            getConversation(user);
        });

    }
}

const getUserInformation =(currentUser) =>{
   /* console.log("Current User : " + JSON.stringify(user,null,3));
    console.log("Current User Name : " + user.name);
    console.log("Contacts : " + JSON.stringify(user.contacts));*/
}

function getConversation (user){
    console.log("Conversation");
    const databaseRef = firebase.database().ref().child('user_chats/'+ user.uid);
    databaseRef.on('value',snap => {
       console.log("Conversation : " + JSON.stringify(snap.val(),null,3));
    })
}

const getContacts = () => {
    var myList = document.getElementById('ContactList');
    myList.innerHTML = '';

    var output =  new Map( Object.entries(user.contacts));
    for (var [key] of output) {
        const databaseRef = firebase.database().ref().child('users/'+key);
        const storageRef = firebase.storage().ref().child(key+'/pp.jpeg');
        var contactProfilePicture;
        storageRef.getDownloadURL().then(function(url){
            console.log("Url : " + url)
            contactProfilePicture = url;
        });
        databaseRef.on('value',snap =>{
            console.log("Key  : " + key);

            var contact = `<li class="list-group-item list-group-item-action" onclick="displayChat(1)">
                            <div class="row">
                                <div class="col-md-2">
                                    <img src="${contactProfilePicture}" class="contact-profile-pic rounded-circle"/>
                                </div>
                                <div class="col-md-10" style="cursor: pointer;">
                                    <div class="contact-name">${snap.val().name}</div>
                                    <div class="contact-last-massage">${snap.val().about}</div>
                                </div>
                            </div>
                        </li>`;

            document.getElementById('ContactList').innerHTML += contact;
        })
      }
}


async function getContactProfilePicture (storageRef){
    
}

function displayChat(id){
    document.getElementById('conversationPanel').removeAttribute('style');
    document.getElementById('emptyConversation').setAttribute('style','display:none');
}

function displayContactList(){
    getContacts();
    document.getElementById('ContactPanel').removeAttribute('style');
    document.getElementById('ConversationPanel').setAttribute('style','display:none');
}

function displayConversationList(){
    document.getElementById('ConversationPanel').removeAttribute('style');
    document.getElementById('ContactPanel').setAttribute('style','display:none');
}

/*Sending Message*/ 
function onKeyDown(){
    document.addEventListener('keydown',function(key){
        if(document.getElementById('userMessageInput').value !== '' && key.which === 13){
            sendMessage();
        }
    });
}


function sendMessage(){
    var message =  `<div class="row justify-content-end">
                        <div class="col-7 col-sm-7 col-md-7">
                            <p class="chat-sent">
                                ${document.getElementById('userMessageInput').value}
                                <span class="chat-time">12:22 AM <i class="fas fa-check"></i></span>
                            </p>
                        </div>
                     </div> `;

    document.getElementById('conversationBody').innerHTML += message;
    document.getElementById('userMessageInput').value = '';
    document.getElementById('userMessageInput').focus();
    document.getElementById('conversationBody').scrollTo(0,document.getElementById('conversationBody').clientHeight);
}    

