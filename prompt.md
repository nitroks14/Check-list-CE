Je souhaite créer une WebApp responsive en HTML5/CSS/JS, utilisable sur Safari (iPhone/iPad), fonctionnant offline, permettant de générer des rapports SAP FSM à partir de checklists interactives.



\### Fonctionnalités attendues :



1\. \*\*Interface utilisateur\*\* :

&nbsp;  - Sélection du type de machine parmi une liste complète :  

&nbsp;    C100/C200/C300/C400/C500/C550/T200/T250/T260/T300/T400/T600/T700/T800/T850/TX710/TX720/TX730/R85/R105/R126/R145/R230/R240/R245/R515/R530/R535/R570/R575/L350/L310

&nbsp;  - Checklist interactive avec statuts : ✅ OK / ⚠️ À surveiller / ❌ À corriger

&nbsp;  - Icônes pour illustrer les sous-éléments : 🛠️ Outillage, 🔥 Soudure, ✂️ Découpe, Embarrage Film, 🧪 Essais, ⚙️ Mécanique, 💧 Refroidissement, ⚡ Électricité, 🧼 Nettoyage, 🧯 Sécurité

&nbsp;  - Génération d’un rapport texte brut prêt à être copié dans SAP FSM

&nbsp;  - Champ pour saisir le \*\*nom du binôme\*\* (facultatif)



2\. \*\*Sauvegarde locale\*\* :

&nbsp;  - À la première utilisation :

&nbsp;    - Générer un \*\*UUID\*\* unique pour l’appareil

&nbsp;    - Demander et stocker le \*\*nom du technicien\*\* (stocké à vie dans `localStorage`)

&nbsp;  - Sauvegarde automatique du rapport en cours dans `localStorage`

&nbsp;  - Réinitialisation manuelle du rapport après usage



3\. \*\*Éditeur de checklist\*\* :

&nbsp;  - Interface Blockly pour créer/modifier des modèles de checklist

&nbsp;  - Arborescence visuelle avec blocs imbriqués

&nbsp;  - Sauvegarde des modèles localement et possibilité de synchronisation GitHub



4\. \*\*Synchronisation automatique\*\* :

&nbsp;  - Tous les jours à \*\*23h45\*\*, synchroniser les \*\*statistiques d’utilisation\*\* vers un \*\*dépôt GitHub dédié\*\*

&nbsp;  - Statistiques à enregistrer : UUID, nom du technicien, date et heure d’utilisation

&nbsp;  - Synchronisation même si l’application est fermée (via Service Worker ou PWA avec `periodicSync`)



5\. \*\*Design\*\* :

&nbsp;  - Inspiré du site https://multivac.com/int/fr

&nbsp;  - Interface épurée, industrielle, adaptée à un usage terrain sur iPad ou iPhone



6\. \*\*Structure du projet\*\* :

&nbsp;  - Organiser les fichiers dans une arborescence claire :

&nbsp;    ```

&nbsp;    multivac-fsm-checklist/

&nbsp;    ├── index.html

&nbsp;    ├── checklist.html

&nbsp;    ├── blockly-editor.html

&nbsp;    ├── css/style.css

&nbsp;    ├── js/app.js

&nbsp;    ├── js/storage.js

&nbsp;    ├── js/sync.js

&nbsp;    ├── js/blockly-config.js

&nbsp;    ├── js/report-generator.js

&nbsp;    ├── data/machines.json

&nbsp;    ├── icons/

&nbsp;    ├── assets/logo.png

&nbsp;    ├── README.md

&nbsp;    ├── manifest.json

&nbsp;    ├── service-worker.js

&nbsp;    └── .gitignore

&nbsp;    ```

&nbsp;  - Préparer une archive `.zip` contenant tous les fichiers, prête à être publiée sur GitHub



\### Sources à prendre en compte :

\- Fichiers existants : `index.html`, `index (v1).html`

\- Spécifications : `Prompt\_Specs\_Multivac\_Checklist.md`

\- Rapports types fournis pour les machines T700, R515, R530, R535

\- Révision embiellage 4 points (R535, R530, R240, R245, R515) et 6 points



Génère tous les fichiers nécessaires (HTML, CSS, JS, Blockly, JSON, README) et organise-les dans une structure de projet complète. Prépare une archive `.zip` contenant le projet prêt à être publié sur GitHub.

