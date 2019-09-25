<script>
  import { timeString } from "../utilities";
  import NotificationMessage from "../elements/NotificationMessage.svelte";
  import Clock from "../elements/Clock.svelte";
  import Time from "../elements/Time.svelte";
  import Timer from "../elements/Timer.svelte";
  export let notification;
  export let formattedTime;
  export let currentTime;
  export let notifications;
</script>

<style>
  /* .bn-notify-notification-info */
  div {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    margin-left: 0.75rem;
    max-width: 78%;
  }

  /* .bn-notify-notification-info-meta */
  p {
    margin: 0.5rem 0 0 0;
    opacity: 0.7;
    font-size: 0.79rem;
    line-height: 1.15;
    font-family: "Helvetica Neue";
  }

  /* .bn-notify-notification-info-meta-duration */
  span {
    font-family: "Helvetica Neue";
  }
</style>

<div class="bn-notify-custom bn-notify-notification-info">
  <NotificationMessage message={notification.message} />
  <p class="bn-notify-custom bn-notify-notification-info-meta">
    <Time time={formattedTime} />
    {#if notification.type === 'pending' && notification.startTime}
      <span class="bn-notify-custom bn-notify-notification-info-meta-duration">
        -
        <Clock />
        <Timer value={timeString(currentTime - notification.startTime)} />
      </span>
    {/if}
  </p>
</div>
