const auth = firebase.auth();
var user;
var chat;

function onFirebaseStateChange(){
    firebase.auth().onAuthStateChanged(onStateChanged);
}
onFirebaseStateChange();


function onStateChanged(currentUser){
    console.log("Current User : " + currentUser.uid);
    if(currentUser){
        var userId = currentUser.uid;
        firebase.database().ref('users').child(userId).child('presence').update({isOnline : "true"});
        firebase.database().ref('users').child(userId).on('value',function(snapshot){
            user = snapshot.val();
            getUserInformation(user);
            getConversation(user);
        })
    }
}


function getUserInformation(currentUser){
    var profile = `<img id="userPicture" src="${currentUser.profile_photo_url}" style="cursor: pointer;" class="user-profile-pic rounded-circle" />`
    document.getElementById('userProfile').innerHTML = profile;
    document.getElementById('userPicture').onclick = displayProfileSettings.bind(this);
}

function getConversation(user){

    firebase.database().ref('user_chats').child(user.uid).on('value',function (snapshot){
        snapshot.forEach(function(val){
            var key = val.key;
            var value = val.node_.value_;
            if(document.getElementById("pp-"+value) === null){
                var conversation = `<li id="${"id-"+value}"class="list-group-item list-group-item-action">
                                    <div class="row">
                                        <div class="col-md-2">
                                            <img id="${"pp-"+value}" src="" class="contact-profile-pic rounded-circle"/>
                                        </div>
                                        <div class="col-md-10" style="cursor: pointer;">
                                        <span id="${"time-"+value}" class="chat-time float-right"></span>
                                            <div id ="${"name-"+value}" class="contact-name"></div>      
                                            <div id="${"lst-"+value}" class="contact-last-massage"></div>
                                        </div>
                                    </div>
                                </li>`
                document.getElementById('ConversationList').innerHTML += conversation;

                //Gets contact name
                firebase.database().ref('users').child(user.uid).child('contacts').child(value).on('value',function(snapshot){
                    var contactName = snapshot.val();
                    document.getElementById("name-"+value).innerHTML = contactName;

                    //Gets contact profile picture
                    //This is not neccessary THIS WILL BE REMOVE
                    firebase.database().ref('users').child(value).on('value',function(snapshot){
                        var contactPicture = snapshot.val().profile_photo_url;
                        document.getElementById("pp-"+value).src=contactPicture;

                        //Gets last message id
                        firebase.database().ref('chats').child(key).child('last_message_id').on('value',function(snapshot){
                            var last_message_id = snapshot.val();

                            //Gets last message
                            firebase.database().ref('chat_messages').child(key).child(last_message_id).on('value',function(snapshot){
                                var isRead = snapshot.val().isRead;
                                var messageType = snapshot.val().messageType;
                                var lastMessage = snapshot.val().message;
                                var time = new Date(snapshot.val().timestamp);
                               // console.log(key,value);
                                document.getElementById("id-"+value).onclick = displayChat.bind(this,[contactName,contactPicture,key,value]);
                                document.getElementById("time-"+value).innerHTML = time.getHours() + " " + time.getMinutes();
                                if(messageType === "image"){
                                    document.getElementById("lst-"+value).innerHTML = `<i class="fas fa-camera"></i> Photo`
                                }else if (messageType === "plaintext"){
                                    document.getElementById("lst-"+value).innerHTML = lastMessage;
                                }

                                if(isRead === "false" && snapshot.val().sender !== user.uid){
                                    document.getElementById("lst-"+value).style.fontWeight = "900";
                                }
                            })
                        })
                    })
                })
            }else{
                return;
            }
        })
    })
}

function getContacts(){
    firebase.database().ref('users').child(user.uid).child('contacts').on('value',function(snapshot){
        snapshot.forEach(function(val){
            var key = val.key;
            var value = val.node_.value_; 
            if(document.getElementById("ppContact-"+key) === null){
                var contact = `<li id="${"idContact-"+key}" class="list-group-item list-group-item-action" >
                                        <div class="row">
                                            <div class="col-md-2">
                                                <img id="${"ppContact-"+key}" src="" class="contact-profile-pic rounded-circle"/>
                                            </div>
                                            <div class="col-md-10" style="cursor: pointer;">
                                                <div id ="${"nameContact-"+key}" class="contact-name"></div>
                                                <div id="${"aboutContact-"+key}" class="contact-last-massage"></div>
                                            </div>
                                        </div>
                                    </li>`

                document.getElementById('ContactList').innerHTML += contact;

                firebase.database().ref('users').child(key).on('value',function(snapshot){
                    var contactPhoto = snapshot.val().profile_photo_url;
                    var contactAbout = snapshot.val().about;
                    document.getElementById("ppContact-"+key).src = contactPhoto;
                    document.getElementById("aboutContact-"+key).innerHTML = contactAbout;
                    document.getElementById("nameContact-"+key).innerHTML = value;
                    document.getElementById("idContact-"+key).onclick = startConversation.bind(this,[key,value,contactPhoto])
                })
            }else{
                return;
            }
        })
    })
}



/*Display Functions*/
function displayProfileSettings(){
    document.getElementById('userProfilePicture').src = user.profile_photo_url;
    document.getElementById('userProfileName').value = user.name;
    document.getElementById('userProfileAbout').value = user.about;

    document.getElementById('userProfileAbout').disabled = true;
    document.getElementById('userProfileName').disabled = true;
    document.getElementById('SettingsPanel').removeAttribute('style');
    document.getElementById('ConversationPanel').setAttribute('style','display:none');
}

function displayContactList(){
    getContacts();
    document.getElementById('ContactPanel').removeAttribute('style');
    document.getElementById('ConversationPanel').setAttribute('style','display:none');
}

function displayConversationList(id){
    document.getElementById('ConversationPanel').removeAttribute('style');
    document.getElementById(id).setAttribute('style','display:none');
}

var displayChatlistener
function displayChat(conversation){
    chat = conversation
    var chatID = chat[2]
    firebase.database().ref('users').child(chat[3]).child('presence').on('value',function(snapshot){
        if(snapshot.val().isOnline === "false"){
            var timestamp = new Date(snapshot.val().last_seen)
            var time = timestamp.getDate() + ": " +  timestamp.getHours() + ":" + timestamp.getMinutes()
            document.getElementById("conversationContactPresence").innerHTML = time;
        }else{
            document.getElementById("conversationContactPresence").innerHTML = "Online"
        }
    })

    document.getElementById("conversationContactName").innerHTML = chat[0]
    document.getElementById("conversationContactPicture").src = chat[1];
    document.getElementById('conversationBody').innerHTML = ""
    document.getElementById('conversationPanel').removeAttribute('style');
    document.getElementById('emptyConversation').setAttribute('style','display:none');
    console.log("ChatID" + chatID);
    console.log(displayChatlistener);
    /*if(displayChatlistener !== undefined){
        firebase.database().ref('chat_messages').child(chatID).off('value',displayChatlistener);
    }*/

    if(chatID !== ""){
         displayChatlistener = firebase.database().ref('chat_messages').child(chatID).once('value', function(snapshot){
            var i = 1; 
            snapshot.forEach(function(val){
    
                if(i === snapshot.numChildren()){
                    getLastMessage(chatID);
                    return;
                }
    
                var time = new Date(val.val().timestamp *1000);
                if(val.val().sender === user.uid){
                    if(val.val().messageType === "plaintext"){
                        if(val.val().isRead === true){
                           // var icon = "/icons/double-check.png" 
                        }
                        var message =  `<div class="row justify-content-end">
                                            <div class="col-7 col-sm-7 col-md-7">
                                                <p id="${"msg-"+val.key}" class="chat-sent">
                                                    ${val.val().message}
                                                    <span class="chat-time">${time.getHours() + ":" + time.getMinutes()} <i class="fas fa-check"></i></span>
                                                </p>
                                            </div>
                                        </div> `;
    
                        
                        document.getElementById('conversationBody').innerHTML += message;
    
                    }
                    else if(val.val().messageType === "image"){
    
                        var message =  `<div class="row">
                                            <div class="col-7 col-sm-7 col-md-7">
                                                <p class="chat-sent">
                                                <img style="width:360px;;height:240px;" src="${val.val().message}"/>
                                                <span class="chat-image-time" style="font-size: 11px; color: gray;margin-top: 2%;margin-right: 1%; float:right;">
                                                       
                                                </span>
                                                </p>   
                                            </div>
                                        </div>`;
        
                        document.getElementById('conversationBody').innerHTML += message;
    
                    }     
                }else{
                    //Update isRead of the message true
                    firebase.database().ref('chat_messages').child(chatID).child(val.key).update({isRead : 'true'}).then(function(){}).catch(function(error) {
                      console.log("Data could not be saved." + error);
                    });
    
                    if(val.val().messageType === "plaintext"){
    
                        var message =  `<div class="row">
                                        <div class="col-7 col-sm-7 col-md-7">
                                            <p class="chat-recieve">
                                                ${val.val().message}
                                                <span class="chat-time">${time.getHours() + ":" + time.getMinutes()}</span>
                                            </p>
                                        </div>
                                    </div>`;
    
                    document.getElementById('conversationBody').innerHTML += message;
    
                    }
                    else if(val.val().messageType === "image"){
    
                        var message =  `<div class="row">
                                        <div class="col-7 col-sm-7 col-md-7">
                                        <p class="chat-recieve">
                                            <img style="width:360px;;height:240px;" src="${val.val().message}"/>
                                            <span class="chat-image-time" style="font-size: 11px; color: gray;margin-top: 2%;margin-right: 1%; float:right;">
                                                ${time.getHours() + ":" + time.getMinutes()}
                                            </span>
                                        </p>    
                                        </div>
                                    </div>`;
    
                        document.getElementById('conversationBody').innerHTML += message;
    
                    }
                }
                i++;
               document.getElementById('conversationBody').scrollTo(0,document.getElementById('conversationBody').clientHeight);
            });
        });
    }
}

function getLastMessage(chatID){
    var messageId 
    var listener = firebase.database().ref('chat_messages').child(chatID).limitToLast(1).on('child_added', function(snapshot){
        messageId = snapshot.key
        //console.log(snapshot.val().chatId)
            var time = new Date(snapshot.val().timestamp *1000)
            if(snapshot.val().sender === user.uid){
                if(snapshot.val().messageType === "plaintext"){
                    var message =  `<div class="row justify-content-end">
                        <div class="col-7 col-sm-7 col-md-7">
                            <p id="${"msg-"+messageId}" class="chat-sent">
                                ${snapshot.val().message}
                                <span class="chat-time">${time.getHours() + ":" + time.getMinutes()} <i class="fas fa-check"></i></span>
                            </p>
                        </div>
                     </div> `;
                    document.getElementById('conversationBody').innerHTML += message;
                }
                else if(snapshot.val().messageType === "image"){
                    if(snapshot.val().message === ""){
                        var message =  `<div class="row">
                                    <div class="col-7 col-sm-7 col-md-7 center-cropped">
                                    <p class="chat-sent">
                                        <img id="${"img-"+messageId}" src="${snapshot.val().message}"/>
                                        <span class="chat-time">${time.getHours() + ":" + time.getMinutes()}</span>
                                    </p>    
                                    </div>
                                </div>`;

                        document.getElementById('conversationBody').innerHTML += message; 
                    }else{
                        var message =  `<div class="row">
                                    <div class="col-7 col-sm-7 col-md-7 center-cropped">
                                    <p class="chat-sent">
                                        <img id="${"img-"+messageId}" src="${snapshot.val().message}"/>
                                        <span class="chat-time">${time.getHours() + ":" + time.getMinutes()}</span>
                                    </p>    
                                    </div>
                                </div>`;

                        document.getElementById('conversationBody').innerHTML += message;
                    }   
                }     
            }else{
                firebase.database().ref('chat_messages').child(chatID).child(messageId).update({isRead : 'true'}).then(function(){
                   // console.log("Data saved successfully.");
                }).catch(function(error) {
                  console.log("Data could not be saved." + error);
                });
                if(snapshot.val().messageType === "plaintext"){
                    var message =  `<div class="row">
                                    <div class="col-7 col-sm-7 col-md-7">
                                        <p class="chat-recieve">
                                            ${snapshot.val().message}
                                            <span class="chat-time">${time.getHours() + ":" + time.getMinutes()}</span>
                                        </p>
                                    </div>
                                </div>`;

                document.getElementById('conversationBody').innerHTML += message;
                }
                else if(snapshot.val().messageType === "image"){
                    if(snapshot.val().message === ""){
                        var message = `<div class="row">
                                            <div class="col-7 col-sm-7 col-md-7 center-cropped">
                                            <p class="chat-recieve">
                                                <img id="${"img-"+messageId}" src="${snapshot.val().message}"/>
                                                <span class="chat-time">${time.getHours() + ":" + time.getMinutes()}</span>
                                            </p>    
                                            </div>
                                        </div>`;
                        document.getElementById('conversationBody').innerHTML += message;
                    }else{
                        var message =  `<div class="row">
                                            <div class="col-7 col-sm-7 col-md-7 center-cropped">
                                            <p class="chat-recieve">
                                                <img src="${snapshot.val().message}"/>
                                                <span class="chat-time">${time.getHours() + ":" + time.getMinutes()}</span>
                                            </p>    
                                            </div>
                                        </div>`;
                        document.getElementById('conversationBody').innerHTML += message;
                    }
                }
                
            }
          // document.getElementById('conversationBody').scrollTo(0,document.getElementById('conversationBody').clientHeight);
    });

    firebase.database().ref('chat_messages').child(chatID).limitToLast(1).on('child_changed',function(snapshot){
        if(snapshot.val().message === "" || snapshot.val().messageType === "plaintext"){
        }else{
            document.getElementById("img-"+messageId).src = snapshot.val().message;
        }
    });
}

var flag;
var contactChat;
var contactId;
var contactName;
var contactPicture;
function startConversation(contact){
    contactId = contact[0];
    contactName = contact[1];
    contactPicture = contact[2]
    contactChat = contact;
    document.getElementById('conversationBody').innerHTML = ""
    firebase.database().ref('user_chats').child(user.uid).once('value', function(snapshot){
        snapshot.forEach(function(val){
            if(val.val() === contactId){
                var chatId = val.key
                flag = true;
                displayChat([contactName,contactPicture,chatId,contactId]);
            }else{
                flag = false;
                displayChat([contactName,contactPicture,"",contactId]);
            }   
        })
       
    })
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
    

    var chatID = chat[2]
    var recipient = chat[3]

    if(flag === false){
        createNewChat();
    }

    if(chatID !== ""){
        var messageReference = firebase.database().ref('chat_messages').child(chatID);
        var newMessageID = messageReference.push().getKey();
    
    
        firebase.database().ref('chat_messages').child(chatID).child(newMessageID).set({
            chatId: chatID,
            isRead: 'false',
            message: document.getElementById('userMessageInput').value,
            messageId:newMessageID,
            messageType: 'plaintext',
            recipient: recipient,
            seenAt : '',
            sender: user.uid,
            timestamp: ((new Date().getTime() * 1000))
        })
    
       /* firebase.database().ref('user_chats_unread_messages').child(recipient).child(chatID).child(newMessageID).push({
            
        })*/
        var notificationsID = firebase.database().ref('notifications').child(recipient).push().getKey();
        
        firebase.database().ref('notifications').child(recipient).child(notificationsID).set({
            image: "",
            text : document.getElementById('userMessageInput').value,
            title : "PigeoTalk"
        });
    
        firebase.database().ref('chats').child(chatID).update({last_message_id: newMessageID}).then(function(){
        }).catch(function(error) {
          console.log("Data could not be saved." + error);
        });
    
        document.getElementById('userMessageInput').value = '';
        document.getElementById('userMessageInput').focus();
        document.getElementById('conversationBody').scrollTo(0,document.getElementById('conversationBody').clientHeight);
    }
}    

function createNewChat(){

    var newChatId = firebase.database().ref('chats').push().getKey();
    firebase.database().ref('chats').child(newChatId).child("members").update({
        [user.uid]:"",
    });

    firebase.database().ref('chats').child(newChatId).child("members").update({
        [contactId]:"",
    });

    firebase.database().ref('chats').child(newChatId).update({
        chatId:newChatId,
    });

    firebase.database().ref('chats').child(newChatId).update({
        last_message_id:"",
    });

    firebase.database().ref('user_chats').child(user.uid).update({
        [newChatId]:contactId,
    });

    firebase.database().ref('user_chats').child(contactId).update({
        [newChatId]:user.uid,
    });

    firebase.database().ref('user_chats').child(user.uid).once('value', function(snapshot){
        snapshot.forEach(function(val){
            if(val.val() === contactId){
                var chatId = val.key
                flag = true;

                var messageReference = firebase.database().ref('chat_messages').child(chatId);
                var newMessageID = messageReference.push().getKey();
            
            
                firebase.database().ref('chat_messages').child(chatId).child(newMessageID).set({
                    chatId: chatId,
                    isRead: 'false',
                    message: document.getElementById('userMessageInput').value,
                    messageId:newMessageID,
                    messageType: 'plaintext',
                    recipient: contactId,
                    seenAt : '',
                    sender: user.uid,
                    timestamp: ((new Date().getTime() * 1000))
                })

                var notificationsID = firebase.database().ref('notifications').child(contactId).push().getKey();
        
                firebase.database().ref('notifications').child(contactId).child(notificationsID).set({
                    image: "",
                    text : document.getElementById('userMessageInput').value,
                    title : "PigeoTalk"
                });
            
                firebase.database().ref('chats').child(chatId).update({last_message_id: newMessageID}).then(function(){
                }).catch(function(error) {
                console.log("Data could not be saved." + error);
                });
            
                document.getElementById('userMessageInput').value = '';
                document.getElementById('userMessageInput').focus();
                document.getElementById('conversationBody').scrollTo(0,document.getElementById('conversationBody').clientHeight);

               displayChat([contactName,contactPicture,chatId,contactId]);
            }
        });
    });
}

//Profile About
function editAbout(){
    document.getElementById('cancelEditAbout').removeAttribute('style');
    document.getElementById('cancelEditAbout').setAttribute('style','cursor: pointer;size:5px;margin-left: 20px;');

    document.getElementById('acceptEditAbout').removeAttribute('style');
    document.getElementById('acceptEditAbout').setAttribute('style','cursor: pointer;size:5px;margin-left: 5px;');

    document.getElementById('editAbout').setAttribute('style','display:none');
    document.getElementById('userProfileAbout').disabled = false;
}

function cancelEditAbout(){
    document.getElementById('userProfileAbout').value = user.about;
    document.getElementById('acceptEditAbout').setAttribute('style','display:none');
    document.getElementById('cancelEditAbout').setAttribute('style','display:none');

    document.getElementById('editAbout').removeAttribute('style');
    document.getElementById('editAbout').setAttribute('style','cursor: pointer;size: 5px ;margin-left: 20px;');
    document.getElementById('userProfileAbout').disabled = true;
}

function acceptEditAbout(){
    var userAbout = document.getElementById('userProfileAbout').value;

    if(user.about !== userAbout){
        firebase.database().ref('users').child(user.uid).update({about: userAbout});
        console.log("Not same");
    }else{
        console.log("Same");
    }
    document.getElementById('acceptEditAbout').setAttribute('style','display:none');
    document.getElementById('cancelEditAbout').setAttribute('style','display:none');
    document.getElementById('editAbout').removeAttribute('style');
    document.getElementById('editAbout').setAttribute('style','cursor: pointer;size: 5px ;margin-left: 20px;');
    document.getElementById('userProfileAbout').disabled = true;
}

//Profile name
function editName(){
    document.getElementById('cancelEditName').removeAttribute('style');
    document.getElementById('cancelEditName').setAttribute('style','cursor: pointer;size:5px;margin-left: 20px;');

    document.getElementById('acceptEditName').removeAttribute('style');
    document.getElementById('acceptEditName').setAttribute('style','cursor: pointer;size:5px;margin-left: 5px;');

    document.getElementById('editName').setAttribute('style','display:none');
    document.getElementById('userProfileName').disabled = false;
}

function cancelEditName(){
    document.getElementById('userProfileName').value = user.name;
    document.getElementById('acceptEditName').setAttribute('style','display:none');
    document.getElementById('cancelEditName').setAttribute('style','display:none');

    document.getElementById('editName').removeAttribute('style');
    document.getElementById('editName').setAttribute('style','cursor: pointer;size: 5px ;margin-left: 20px;');
    document.getElementById('userProfileName').disabled = true;
}

function acceptEditName(){
    var userName = document.getElementById('userProfileName').value;

    if(user.name !== userName){
        firebase.database().ref('users').child(user.uid).update({name: userName});
        console.log("Not same");
    }else{
        console.log("Same");
    }
    document.getElementById('acceptEditName').setAttribute('style','display:none');
    document.getElementById('cancelEditName').setAttribute('style','display:none');
    document.getElementById('editName').removeAttribute('style');
    document.getElementById('editName').setAttribute('style','cursor: pointer;size: 5px ;margin-left: 20px;');
    document.getElementById('userProfileName').disabled = true;

}

//Change Profile Picture
function getProfilePicture(){
    document.getElementById('getImage').click();
}

function uploadProfilePicture(event){
    var blob = new Blob([event.files[0]], { type: "image/jpeg" }); 

        firebase.storage().ref(user.uid).child("pp.jpeg").put(blob).then(function(snapshot){
            snapshot.ref.getDownloadURL().then(function(downloadURL){
                firebase.database().ref('users').child(user.uid).update({profile_photo_url: downloadURL});
                document.getElementById('userProfilePicture').src = downloadURL;
            });
        }).catch(function(error) {
            console.log("Data could not be saved." + error);
        });
}

function sendImage(){
    document.getElementById('uploadImage').click();
}

function uploadImage(event){
    var blob = new Blob([event.files[0]], { type: "image/jpeg" }); 
    console.log(blob);

    var chatID = chat[2]
    var recipient = chat[3]
    var messageReference = firebase.database().ref('chat_messages').child(chatID);
    var newMessageID = messageReference.push().getKey();

    if(chatID !== null){
        var time = new Date().getTime();
        firebase.storage().ref('chats').child(chatID).child('image').child("IMAGE_"+time).put(blob).then(function(snapshot){
            snapshot.ref.getDownloadURL().then(function(downloadURL){
                firebase.database().ref('chat_messages').child(chatID).child(newMessageID).set({
                    chatId: chatID,
                    isRead: 'false',
                    message: downloadURL,
                    messageId:newMessageID,
                    messageType: 'image',
                    recipient: recipient,
                    seenAt : '',
                    sender: user.uid,
                    timestamp: ((new Date().getTime() * 1000))
                });

                var notificationsID = firebase.database().ref('notifications').child(recipient).push().getKey();
                firebase.database().ref('notifications').child(recipient).child(notificationsID).set({
                    image: downloadURL,
                    text : "\uD83D\uDCF7 Photo",
                    title : "PigeoTalk"
                });

                firebase.database().ref('chats').child(chatID).update({last_message_id: newMessageID}).then(function(){
                }).catch(function(error) {
                  console.log("Data could not be saved." + error);
                });
            });
        });
    }
}