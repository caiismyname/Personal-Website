/*
This blog engine populates the `blog.html` page as an inline script.

It populates both the left-side table-of-contents, as well as the corresponding main-contents on the right.

It will search for individual blog posts in the `./blog_posts` directory. 

Each post should be a separate .md file, which will be rendered and displayed in its entirety.

Formatting:
    - The first line will be used as the title of the post (for table-of-contents purposes)
    - The second line should always contain the date in "month.day.year" format. Articles with a date in the future
      won't be "published" until that date.
*/


const filenames = [];
const posts = [];
const promises = [];
const converter = new showdown.Converter(); // markdown --> HTML converter

function cleanString(input) {
    console.log(input);
    // First replace removes markdown characters, second removes leading/trailing whitepsace
    return (input.replace(/[\_\*\#]/gi, "").replace(/^\s+|\s+$/g, ""));
}

$.ajax({
    url: "./blog_posts/",
    success: function(data) {
       $(data).find("li > a").each(function() {
            filenames.push($(this).attr("href"));
       });

       filenames.forEach(file => {
            if (file.split('.')[file.split('.').length - 1] !== "md") {
                return;    
            }

            const promise = new Promise(function (resolve, reject) {
                $.ajax({
                    url: ("./blog_posts/" + file),
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
                        });

                        // Append the main content immediately since they all default to hidden
                        $("#mainContents").append(mainContentDiv);

                        posts.push({date: date, tocEntry: tableOfContentsEntry});
                        resolve();
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

    $(posts[0].tocEntry).click(); // Show the latest post by default
}