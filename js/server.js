// Exemple de serveur Node.js + Express pour recevoir les statistiques et les committer dans un dépôt GitHub.
// Utilise @octokit/rest. STOCKER GITHUB_TOKEN dans une variable d'environnement côté serveur.
// Déploiement possible sur Vercel / Heroku / AWS / etc.

const express = require('express');
const bodyParser = require('body-parser');
const { Octokit } = require('@octokit/rest');
const app = express();
app.use(bodyParser.json({limit:'100kb'}));

// Config serveur (adapter)
const OWNER = 'OWNER'; // repo owner
const REPO = 'REPO';   // repo name
const BRANCH = 'main';
const STATS_DIR = 'sync-stats'; // dossier dans le repo où on sauvegarde les stats

if(!process.env.GITHUB_TOKEN){
  console.error('GITHUB_TOKEN not provided in environment');
  process.exit(1);
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

app.post('/sync', async (req, res) => {
  try{
    const payload = req.body;
    // Validate payload minimally
    if(!payload || !payload.uuid) return res.status(400).json({error:'bad_payload'});

    const filename = `${STATS_DIR}/${new Date().toISOString().replace(/[:.]/g,'-')}_${payload.uuid}.json`;
    const content = Buffer.from(JSON.stringify(payload,null,2)).toString('base64');

    // Create file in repo
    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: filename,
      message: `Sync stats from ${payload.uuid} at ${payload.timestamp}`,
      content,
      branch: BRANCH
    });

    return res.json({ok:true, path:filename});
  }catch(e){
    console.error('Sync error', e);
    return res.status(500).json({error: e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Sync server listening on', PORT));
