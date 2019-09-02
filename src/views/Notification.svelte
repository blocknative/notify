<script>
  import { onDestroy } from "svelte";
  import { fly, fade } from "svelte/transition";
  import { elasticInOut } from "svelte/easing";
  import { timeString, formatTime } from "../utilities";
  import CloseIcon from "../components/CloseIcon.svelte";
  import { notifications } from "../stores";
  export let notification;

  let currentTime = Date.now();

  const intervalId = setInterval(() => {
    currentTime = Date.now();
  }, 1000);

  onDestroy(() => clearInterval(intervalId));

  const formattedTime = formatTime(currentTime);

  $: if (notification.autoDismiss) {
    setTimeout(() => {
      notifications.remove(notification);
    }, notification.autoDismiss);
  }

  const icons = {
    hint: "/icons/icon-info-animated.svg",
    pending: "/icons/icon-clock-animated.svg",
    success: "/icons/icon-check-animated.svg",
    error: "/icons/icon-alert-animated.svg"
  };
</script>

<style>
  /* === TARGET BY ELEMENT TO ALLOW CUSTOM OVERRIDES TO HAVE ADEQUATE SPECIFICITY ===*/

  /* .bn-notify-notification */
  li {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0.75rem;
    font-size: 0.889rem;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
    margin-top: 0.75rem;
  }

  /* .bn-notify-notification-status-icon */
  div:nth-child(1) {
    height: 100%;
    width: 1.4rem;
  }

  /* .bn-notify-notification-status-icon img */
  /* div:nth-child(1) img {
    width: 100%;
    height: auto;
  } */

  /* .bn-notify-notification-info */
  div:nth-child(2) {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    margin-left: 0.75rem;
    max-width: 80%;
  }

  /* .bn-notify-notification-info-meta */
  div:nth-child(2) p:nth-child(1) {
    margin: 0;
    color: #4a4a4a;
  }

  /* .bn-notify-notification-info-meta */
  div:nth-child(2) p:nth-child(2) {
    margin: 0.75rem 0 0 0;
    color: #aeaeae;
    font-size: 0.79rem;
  }

  /* .bn-notify-notification-info-meta-clock */
  div:nth-child(2) p:nth-child(2) i {
    width: 15px;
    height: 16px;
    display: inline-block;
    background-image: url("https://assist.blocknative.com/images/jJu8b0B.png");
    background-position: -66px 0px;
    vertical-align: sub;
  }

  div:nth-child(3) {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
  }
</style>

<li
  class="bn-notify-notification"
  transition:fly={{ duration: 600, x: 40, easing: elasticInOut }}>
  <div class="bn-notify-notification-status-icon">
    <img src={icons[notification.type]} alt="status" />
  </div>
  <div class="bn-notify-notification-info">
    <p>{notification.message}</p>
    <p class="bn-notify-notification-info-meta">
      <span class="bn-notify-notification-info-meta-timestamp">
        {formattedTime}
      </span>
      {#if notification.type === 'pending' && notification.startTime}
        <span class="bn-notify-notification-info-meta-duration">
          -
          <i class="bn-notify-notification-info-meta-clock" />
          <span class="bn-notify-notification-info-meta-duration-time">
            {timeString(currentTime - notification.startTime)}
          </span>
        </span>
      {/if}
    </p>
  </div>
  <div on:click={() => notifications.remove(notification)}>
    <CloseIcon />
  </div>
</li>
