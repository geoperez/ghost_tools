# ghost_tools

Ghost tools to backup content using [Ghost API Authentication](https://github.com/TryGhost/Ghost/wiki/How-does-oAuth-work-with-Ghost%3F). The Ghost API is WIP, so this script could be obsolete any momemnt.

## How to run ghost_tools

<pre>
npm install
node index.js < blogurl > < email >
</pre>

You will need to enter your blog domain (if you use **GhostPro** use the ghost.io domain), email address and password. A content folder will be created with all the images in your account.

## ToDo

* ~~Backup Markdown files~~
* Backup tags images (??)
* Backup databases
* Allow to choose what to backup
