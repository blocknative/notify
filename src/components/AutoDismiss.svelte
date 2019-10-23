<script>
  import { notifications } from "../stores";
  export let notification;

  if (notification.autoDismiss) {
    setTimeout(() => {
      notifications.remove(notification.id);
    }, notification.autoDismiss);
  }
</script>
