# 📚 Système de Gestion de Bibliothèque

Une application web Full-Stack développée pour automatiser et simplifier la gestion des prêts de livres, du catalogue et des étudiants au sein de la bibliothèque de l'ISGA. Ce projet repose sur une architecture robuste **MVC (Modèle-Vue-Contrôleur)** en PHP.

## 🚀 Fonctionnalités Principales

Le système est divisé en deux espaces sécurisés avec des règles de gestion strictes :

### 👨‍🎓 Espace Étudiant (Utilisateur)
* **Catalogue interactif** : Recherche de livres par titre, auteur, catégorie ou langue.
* **Emprunts intelligents** : Limite stricte fixée à **3 livres simultanés** par étudiant.
* **Gestion des délais** : La durée d'emprunt est fixée à **15 jours**.
* **Système anti-retard** : Blocage automatique de nouveaux emprunts si un livre n'est pas restitué à temps.
* **Tableau de bord personnel** : Suivi des emprunts en cours, historique de lecture et alertes de statut.
* **Messagerie** : Envoi de suggestions ou réclamations à l'administration.

### 🛡️ Espace Administrateur
* **Dashboard interactif (KPIs)** : Statistiques en temps réel (nombre total de livres, étudiants inscrits, emprunts en cours, livres en retard).
* **Gestion du catalogue (CRUD)** : Ajout, modification et suppression de livres avec upload d'images (converties/stockées en local).
* **Gestion dynamique des stocks** : Recalcul automatique du stock physique et du stock disponible lors des emprunts et des retours.
* **Validation des transactions** : Validation des retours de livres en un clic.
* **Supervision des étudiants** : Suivi détaillé des profils étudiants et de leurs infractions (retards).

## 💻 Technologies Utilisées

* **Frontend** : HTML5, CSS3, JavaScript (Fetch API, manipulation du DOM, Modales)
* **Backend** : PHP 8+ (Architecture MVC, POO)
* **Base de données** : MySQL (Requêtes préparées via PDO, Transactions SQL)
* **Serveur local** : XAMPP (Apache)
* **Outils** : Visual Studio Code, Git/GitHub

## ⚙️ Installation et Configuration (Local)

Pour faire tourner ce projet sur votre machine locale, suivez ces étapes :

1. **Cloner le dépôt** dans le dossier `htdocs` de votre serveur XAMPP :
   ```bash
   git clone [https://github.com/AlMoutawakil/Projet_Gestion_Bibliotheque.git](https://github.com/AlMoutawakil/Projet_Gestion_Bibliotheque.git)
