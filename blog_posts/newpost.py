import sys
import datetime

title = sys.argv[1].replace(".md", "")

# Add post to index.txt
indexFile = open("index.txt", "a")
indexFile.write("\n" + title)
indexFile.close()

# Read in contents of post
contentsFile = open(title + ".md", "r")
contents = contentsFile.read()
contentsFile.close()

# Bold the title
titleText = contents.split("\n")[0]
titleText = contents.split("\n")[0]
boldedTitle = titleText.replace("# ", "# **") + "**"

# Add the date (day the script is run)
date = datetime.datetime.today().strftime('%-m.%-d.%Y')

# Add in template for LI links
headingIndices = [pos for pos, char in enumerate(contents[:-1]) if char + contents[pos + 1] == "##"]

headings = []
for start in headingIndices:
    heading = ""
    cur = start + 3 # Headings are structured `## foo`, so skip 3 positions in to get the start of the text
    while (contents[cur] != "\n"):
        heading += contents[cur]
        cur += 1

    headings.append(heading)

linkedinLinks = "_Read it on LinkedIn:_\n"
for heading in headings:
    linkedinLinks += "- [_" + heading + "_]()\n"

# Save formatted md in `blog_posts` dir
formatedPostContents = boldedTitle + "\n\n" + date + "\n\n" + linkedinLinks + "\n\n" + contents.replace(titleText, "").strip()
newPost = open("newpost.md", "w")
newPost.write(formatedPostContents)
newPost.close()