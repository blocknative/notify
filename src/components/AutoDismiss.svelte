<script lang="ts">
  import { notifications } from "../stores";
  export let notification: {
    id: string;
    type: string;
    key: string;
    startTime?: number;
    eventCode: string;
    message: string;
    autoDismiss?: number;
  } = { id: "", type: "", key: "", message: "", eventCode: "" };

  if (notification.autoDismiss && notification.id) {
    setTimeout(() => {
      notifications.remove(notification.id, notification.eventCode);
    }, notification.autoDismiss);
  }
</script>
