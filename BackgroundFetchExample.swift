// EXEMPLE (Swift) : utiliser BackgroundTasks (iOS 13+) pour réveiller l'app native wrapper
// Ce code suppose que tu embarques la WebApp dans un WKWebView native et que l'app native appelle l'endpoint '/sync'.
// A ajouter à ton projet Xcode (AppDelegate + Info.plist modifications).
//
// Info.plist:
// - Permettre Background Fetch / Background processing
// - BGTaskSchedulerPermittedIdentifiers : array avec "com.example.checklist.refresh"

// AppDelegate (extraits)
import UIKit
import BackgroundTasks

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

  func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // Enregistrer la tâche
    BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.example.checklist.refresh", using: nil) { task in
      self.handleAppRefresh(task: task as! BGAppRefreshTask)
    }
    scheduleAppRefresh()
    return true
  }

  func applicationDidEnterBackground(_ application: UIApplication) {
    scheduleAppRefresh()
  }

  func scheduleAppRefresh() {
    let request = BGAppRefreshTaskRequest(identifier: "com.example.checklist.refresh")
    request.earliestBeginDate = Date(timeIntervalSinceNow: 60*60*24) // essayer quotidien
    do {
      try BGTaskScheduler.shared.submit(request)
    } catch {
      print("Impossible de planifier BGTask: \(error)")
    }
  }

  func handleAppRefresh(task: BGAppRefreshTask) {
    // Planifier la prochaine exécution
    scheduleAppRefresh()

    // Créer un expiration handler
    task.expirationHandler = {
      // Nettoyage si la tâche doit être arrêtée
    }

    // Exécuter la synchronisation : appeler l'endpoint serveur
    let url = URL(string: "https://your-sync-server.example.com/trigger-device-sync")!
    var req = URLRequest(url: url)
    req.httpMethod = "POST"
    // Ajouter en-têtes / body si nécessaire (token côté serveur pour autoriser)

    let operation = URLSession.shared.dataTask(with: req) { data, resp, err in
      // Indiquer que la tâche est terminée
      task.setTaskCompleted(success: (err == nil))
    }
    operation.resume()
  }
}