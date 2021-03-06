/*
This blog engine populates the `blog.html` page as an inline script.

It populates both the left-side table-of-contents, as well as the corresponding main-contents on the right.

It will search for individual blog posts in the `./blog_posts` directory. 

Each post should be a separate .md file, which will be rendered and displayed in its entirety.

Formatting:
    - The first line will be used as the title of the post (for table-of-contents purposes)
    - The second line should always contain the date in "month.day.year" format. Articles with a date in the future
      won't be "published" until that date.
    - There must be an `index.txt` file within the `blog_posts` directory that contains the name of each .md file, one per line
        - This is because the original idea of inspecting the directory itself doesn't work on github hosted sites.
*/


const posts = [];
const promises = [];
const converter = new showdown.Converter(); // markdown --> HTML converter

function cleanString(input) {
    // First replace removes markdown characters, second removes leading/trailing whitepsace
    return (input.replace(/[\_\*\#]/gi, "").replace(/^\s+|\s+$/g, ""));
}

$.ajax({
    url: "/blog_posts/index.txt",
    dataType: "text",
    success: function(data) {
        const fileNames = data.split("\n").map(fileName => cleanString(fileName));

        fileNames.forEach(file => {
            if (file === "") {
                return;
            }

            const promise = new Promise(function (resolve, reject) {
                $.ajax({
                    url: ("./blog_posts/" + file + ".md"),
                    dataType: "text",
                    success: function(data) {
                        const title = cleanString(data.split('\n')[0]);
                        
                        // It's not recommended to use parseDate so I'm manually parsing the date
                        const today = new Date();
                        const date = new Date();
                        date.setMonth(Number(cleanString(data.split('\n')[1]).split(".")[0]) - 1);
                        date.setDate(cleanString(data.split('\n')[1]).split(".")[1]);
                        date.setFullYear(cleanString(data.split('\n')[1]).split(".")[2]);

                        if (date > today) {
                            resolve();
                            return;
                        }

                        // Create div of the actual article
                        const outputHTML = converter.makeHtml(data);
                        const mainContentDiv = document.createElement("div");
                        const mainContentID = title + "-content";
                        
                        mainContentDiv.innerHTML = outputHTML;
                        $(mainContentDiv).attr("id", mainContentID);
                        $(mainContentDiv).addClass("blog-post-hide");

                        // Create TOC entry
                        const tableOfContentsEntry = document.createElement("p");
                        tableOfContentsEntry.innerHTML = title;
                        $(tableOfContentsEntry).addClass("blog-table-of-contents-entry");
                        $(tableOfContentsEntry).click(() => {
                            $(".blog-post-show").removeClass("blog-post-show").addClass("blog-post-hide");
                            $(mainContentDiv).removeClass("blog-post-hide").addClass("blog-post-show");

                            $(".blog-table-of-contents-entry-selected").removeClass("blog-table-of-contents-entry-selected");
                            $(tableOfContentsEntry).addClass("blog-table-of-contents-entry-selected");

                            setURL(file);
                        });

                        // Append the main content immediately since they all default to hidden
                        $("#mainContents").append(mainContentDiv);

                        posts.push({date: date, tocEntry: tableOfContentsEntry, fileName: file});
                        resolve();
                    },
                    error: function(xhr, textStatus, errorThrown) {
                        console.log(file + " | " + errorThrown);
                        reject();
                    }
                });
            });

            promises.push(promise);
        });

        Promise.all(promises).then(
            () => { sortAndInjectTOC() },
            () => { alert("Failed to load blog posts, please retry. Sorry") }
        );        
    }
});

function setURL(postName) {
    const urlParams = new URLSearchParams(window.location.search);
    const baseURL = window.location.href.split("?")[0];
    urlParams.set("post", postName);
    const newURL = baseURL + "?" + urlParams.toString();

    history.replaceState('', '', newURL);
}

function getCurrentPostFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("post")) {
        return (urlParams.get("post"));
    } else {
        return (null);
    }
}

function sortAndInjectTOC() {
     // Sort latest --> earliest so TOC is in order (most recent at top)
     posts.sort((a, b) => {
        if (a.date > b.date) {
            return (-1);
        } else {
            return (1);
        }
    });

    posts.forEach(post => {
        $("#tableOfContents").append(post.tocEntry);
    })

    // If a post is specified, show it, otherwise default to the latest post.
    // Note that a post is shown by calling `.click()` on it's `.tocEntry` stored in the object in the global `posts` array
    // The onClicker handler handles everything needed to correctly "show" the post
    const postToShow = getCurrentPostFromURL();
    if (postToShow) {
        const post = posts.find(p => p.fileName === postToShow);
        $(post.tocEntry).click();
    } else {
        $(posts[0].tocEntry).click();
    }
}