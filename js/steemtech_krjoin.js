 let $sMessageWarning = '';
 let $sMessageWarningHeader = '';

 let startDate;
 let endDate;
 let period;

 let MAX = 100;

 let recur_t = 0;

 $(document).ready(function() {;
     initPage();
 });

 function initPage() {
     $sMessageWarning = $("#message_warning");
     $sMessageWarningHeader = $("#message_warning_header");

     loadDiscussions(7);
 }

 function refreshPage() {

 }

 // https://steemit.com/steemjs/@morning/steem-api-guide-how-to-get-recent-posts-getdiscussionsbycreated-load-more-and-pagination
 function loadDiscussions(days) {
     refreshPage();

     period = days;

     // $("#wrap_loader").addClass('active');

     steem.api.getDiscussionsByCreated({
             "tag": "kr-join",
             "limit": MAX
         },
         (err, result) => {
             if (err) {
                 console.log(err);
             } else {
                 endDate = new Date(result[0].created);

                 makeTable(result);
                 recursiveLoading(result[MAX - 1].permlink, result[MAX - 1].author);
             }
         });
 }

 function recursiveLoading(lastPermlink, lastAuthor) {

     steem.api.getDiscussionsByCreated({
             "tag": "kr-join",
             "limit": MAX,
             "start_permlink": lastPermlink,
             "start_author": lastAuthor
         },
         (err, result) => {
             if (err) {
                 console.log(err);
             } else {
                 makeTable(result);

                 let len = result.length - 1;

                 startDate = new Date(result[len].created);
                 let targetDate = new Date(endDate - (period * 24 * 60 * 60 * 1000));
                 let createdDate = new Date(result[len].created);

                 /*
                  * len : last part is less then 100.
                  * recur_t : load t * 100 items. variable value for developer.
                  */
                 if (createdDate < targetDate ||
                     len < 99 ||
                     recur_t > 40) {
                     // finish
                     ;
                 } else {
                     recur_t++;
                     recursiveLoading(result[len].permlink, result[len].author);
                 }
             }
         });
 }

 function makeTable(posts) {

     posts.forEach(post => {
         steem.api.getAccounts([post.author],
             (err, result) => {

                 let userReputation = calcReputation(result[0].reputation);
                 if (userReputation >= 25 &&
                     userReputation <= 40 &&
                     result[0].post_count <= 200 &&
                     isCreatedInMonth(result[0].created)) {


                     // if (result[0].json_metadata != undefined && result[0].json_metadata)

                     let profileImg = "images/empty_profile.png";
                     let jsonProfile = JSON.parse(result[0].json_metadata);

                     if (jsonProfile.profile != undefined &&
                         jsonProfile.profile.profile_image != undefined) {
                         //profileImg = jsonProfile.profile.profile_image;
                         profileImg = "https://steemitimages.com/u/" + post.author + "/avatar"
                     }


                     let mainImg = "images/empty_image.jpg";
                     let jsonPost = JSON.parse(post.json_metadata);

                     if (jsonPost.image != undefined) {
                         mainImg = jsonPost.image[0];
                     }


                     let postBody = post.body;

                     if (postBody.length > 50) {
                         postBody = postBody.substr(0, 50) + "...";
                     }

                     let createdTime = getTimeToPrint(new Date(post.created));
                     let template = `
                    <div class="row">
                        <div class="ui column inverted top attached segment" style="background-color:#eeeeee;border:1px solid #d4d4d5;padding:0.5em 1em;">

                        <div class="ui stackable container grid">
                            <div class="ui six wide column">
                                <img src="${profileImg}" class="ui avatar image">
                                <span>
                                    <a href="https://steemit.com/@${post.author}" target="_blank">@${post.author}</a>
                                    <span style="color:#777777;">
                                        (${userReputation})
                                    </span>
                                </span>
                            </div>
                            <div class="ui ten wide column right aligned">                                
                                 <p style="color:#777777;padding-top:0.2em;">${createdTime}</p>
                            </div>
                        </div>
                        </div>
                        <div class="ui column bottom attached stacked segment">
                            <div class="ui stackable container grid">
                                <div class="row" style="padding:0.4em;">
                                    <div class="ui two wide column">
                                        <center><a href="https://steemit.com${post.url}" target="_blank"><img src="${mainImg}" class="ui rounded image small"></a></center>
                                    </div>
                                    <div class="ui fourteen wide column">
                                        <a href="https://steemit.com${post.url}" target="_blank">
                                        <p class="ui small header">${post.title}</p>
                                        <p>${postBody}</p>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;

                     $("#main_container").append(template);
                 }

             });
     });
 }

 function isCreatedInMonth(created) {
     let now = new Date();
     let timeDiff = parseInt((now.getTime() - (new Date(created)).getTime()) / (3600000 * 24));

     return timeDiff < 32;
 }

 function getTimeToPrint(t) {
     let ret = new Date(t.valueOf() + (18 * 60 * 60 * 1000));
     ret = ret.toISOString().replace('T', ' ');
     ret = ret.substr(0, ret.length - 5) + " (KST)";

     return ret;
 }


 function getTimeDiff(createdTime) {
     let diff = endDate.getTime() - createdTime.getTime();

     return parseInt(diff / 3600000);
 }

 function isHangul(phrase) {
     let regExp = /[ㄱ-힣]/g;
     if (phrase.match(regExp) != null) {
         return "O";
     }
     return "X";
 }

 // https://steemit.com/steemit/@digitalnotvir/how-reputation-scores-are-calculated-the-details-explained-with-simple-math
 function calcReputation(rep) {
     var ret = Math.log(rep) / Math.log(10); // same as 'Math.log10(rep) [I.E. doesn't support Math.log10]
     if (isNaN(ret)) {
         ret = 0;
     }
     ret = Math.max(ret - 9, 0);
     ret = Math.abs(ret) * 9 + 25

     return parseInt(ret);
 }