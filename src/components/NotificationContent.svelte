<script lang="ts">
  import { timeString } from '../utilities'
  import NotificationMessage from '../elements/NotificationMessage.svelte'
  import Clock from '../elements/Clock.svelte'
  import Time from '../elements/Time.svelte'
  import Timer from '../elements/Timer.svelte'

  export let notification: {
    id: string
    type: string
    key: string
    startTime?: number
    eventCode?: string
    message: string
    autoDismiss?: number
  }
  export let formattedTime: string
  export let currentTime: number
</script>

<style>
  /* .bn-notify-notification-info */
  div {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    font-size: inherit;
    font-family: inherit;
    margin-left: 0.75em;
    max-width: 78%;
  }

  /* .bn-notify-notification-info-meta */
  p {
    display: flex;
    align-items: center;
    margin: 0.5em 0 0 0;
    opacity: 0.7;
    font-size: 0.889em;
    line-height: 1.15;
    font-family: inherit;
  }

  /* .bn-notify-notification-info-meta-duration */
  span {
    font-family: inherit;
    display: flex;
    align-items: center;
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
