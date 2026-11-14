const fs = require('node:fs/promises');
const path = require('node:path');

async function patchFile(file, original, replacement) {
  const source = await fs.readFile(file, 'utf8');

  if (source.includes(replacement)) {
    return;
  }
  if (!source.includes(original)) {
    throw new Error('알림 네이티브 패치 대상이 변경되었습니다: ' + file);
  }
  await fs.writeFile(file, source.replace(original, replacement));
}

module.exports = async function patchNotificationPresentation(projectRoot) {
  const root = path.dirname(
    require.resolve('expo-notifications/package.json', { paths: [projectRoot] }),
  );
  const source = path.join(root, 'android/src/main/java/expo/modules/notifications');

  await patchFile(
    path.join(source, 'service/delegates/ExpoPresentationDelegate.kt'),
    '      notificationManager.notify(tag, id, androidNotification)',
    `      // Yong Planner: replace the previous daily summary even while JS is not running.
      if (tag.startsWith("yong-planner:summary:")) {
        notificationManager.activeNotifications
          .filter { it.tag?.startsWith("yong-planner:summary:") == true && it.tag != tag }
          .forEach { notificationManager.cancel(it.tag, it.id) }
      }
      notificationManager.notify(tag, id, androidNotification)`,
  );
  await patchFile(
    path.join(source, 'notifications/presentation/builders/ExpoNotificationBuilder.kt'),
    '    builder.setStyle(NotificationCompat.BigTextStyle().bigText(content.text))',
    `    // Yong Planner: empty daily summaries have no expanded view.
    val emptyPlannerSummary = notification.notificationRequest.identifier.startsWith("yong-planner:summary:") && content.body?.optBoolean("hasSchedules", true) == false
    if (!emptyPlannerSummary) {
      builder.setStyle(NotificationCompat.BigTextStyle().bigText(content.text))
    }`,
  );
};
