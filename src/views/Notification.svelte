<script>
  import { onDestroy } from "svelte";
  import { fly, fade } from "svelte/transition";
  import { flip } from "svelte/animate";
  import { quintOut } from "svelte/easing";
  import { timeString, formatTime } from "../utilities";
  import { notifications } from "../stores";
  export let notification;

  let updating;
  let currentTime = Date.now();

  if (notification.type === "pending") {
    const intervalId = setInterval(() => {
      currentTime = Date.now();
    }, 1000);

    onDestroy(() => clearInterval(intervalId));
  }

  $: if (notification.autoDismiss) {
    setTimeout(() => {
      notifications.remove(notification.id, notification.type);
    }, notification.autoDismiss);
  }

  $: if (notification.message) {
    updating = true;
    setTimeout(() => {
      updating = false;
    }, 500);
  }

  const notificationTime = formatTime(currentTime);
</script>

<style>
  * {
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font: inherit;
    vertical-align: baseline;
    box-sizing: border-box;
    color: #4a4a4a;
  }

  p {
    font-size: 1em;
    line-height: 1.266em;
  }

  .bn-notification {
    display: flex;
    width: 100%;
    flex-flow: row nowrap;
    background: #fff;
    border-radius: 2px;
    padding: 13px 10px;
    text-align: left;
    margin-bottom: 5px;
    box-shadow: 0px 2px 15px rgba(0, 0, 0, 0.1);
    font-family: "Source Sans Pro", "Open Sans", "Helvetica Neue", Arial,
      sans-serif;
  }

  .bn-notification-info {
    margin-left: 10px;
    max-width: 85%;
  }

  .bn-notification.bn-pending {
    border-color: #ffc137;
    border-width: 0px 0px 0px 2px;
    border-style: solid;
  }
  .bn-notification.bn-success {
    border-color: #7ed321;
    border-width: 0px 0px 0px 2px;
    border-style: solid;
  }
  .bn-notification.bn-error {
    border-color: #ff3f4a;
    border-width: 0px 0px 0px 2px;
    border-style: solid;
  }
  .bn-notification.bn-hint {
    border-color: #4a90e2;
    border-width: 0px 0px 0px 2px;
    border-style: solid;
  }

  .bn-status-icon {
    width: 18px;
    height: 18px;
    background-image: url("https://assist.blocknative.com/images/jJu8b0B.png");
    border-radius: 50%;
  }

  .bn-pending .bn-status-icon {
    background-image: url("https://assist.blocknative.com/images/mqCAjXV.gif");
    background-size: 18px 18px;
  }
  .bn-success .bn-status-icon {
    background-position: -54px 55px;
  }
  .bn-error .bn-status-icon {
    background-position: -36px 55px;
  }

  .bn-notification:hover .bn-status-icon {
    background-image: url("https://assist.blocknative.com/images/jJu8b0B.png") !important;
    background-size: 82px 36px;
    background-position: 0px 19px !important;
  }
  .bn-notification:hover .bn-status-icon:hover {
    background-image: url("https://assist.blocknative.com/images/jJu8b0B.png") !important;
    background-size: 82px 36px;
    background-position: -18px 19px !important;
    cursor: pointer;
  }

  .bn-duration-hidden {
    visibility: hidden;
  }

  .bn-clock {
    width: 15px;
    height: 16px;
    display: inline-block;
    background-image: url("https://assist.blocknative.com/images/jJu8b0B.png");
    background-position: -66px 0px;
    vertical-align: sub;
  }

  .bn-notification-meta {
    color: #aeaeae;
    font-size: 0.79em;
    margin-top: 5px;
  }

  .bn-notification-meta .bn-timestamp {
    color: #aeaeae;
  }

  .bn-notification-meta .bn-timestamp:hover {
    cursor: pointer;
  }

  .bn-status-icon {
    position: relative;
  }

  .progress-tooltip {
    position: absolute;
    z-index: 1070;
    display: none;
    font-style: normal;
    font-weight: normal;
    letter-spacing: normal;
    line-break: auto;
    line-height: 1.42857143;
    text-align: left;
    text-align: start;
    text-decoration: none;
    text-shadow: none;
    text-transform: none;
    white-space: normal;
    word-break: normal;
    word-spacing: normal;
    word-wrap: normal;
    font-size: 12px;
    opacity: 0;
    filter: alpha(opacity=0);
    bottom: 21px;
    width: 190px;
    -webkit-transition: opacity 0.25s ease-out 100ms;
    -moz-transition: opacity 0.25s ease-out 100ms;
    -o-transition: opacity 0.25s ease-out 100ms;
    transition: opacity 0.25s ease-out 100ms;
  }

  .progress-tooltip-inner {
    max-width: 200px;
    padding: 3px 8px;
    color: #ffffff;
    text-align: center;
    background-color: #000000;
    border-radius: 4px;
  }

  .progress-tooltip::after {
    bottom: 0;
    left: 10px;
    margin-left: -5px;
    margin-bottom: -5px;
    border-width: 5px 5px 0;
    position: absolute;
    width: 0;
    height: 0;
    border-color: transparent;
    border-top-color: #000;
    border-style: solid;
    content: "";
  }

  .bn-status-icon:hover .progress-tooltip {
    opacity: 1;
    filter: alpha(opacity=1);
    display: block;
  }
</style>

<li
  class="bn-notification bn-{notification.type}"
  transition:fly={{ duration: 400, x: 380, easing: quintOut }}>
  <span
    class="bn-status-icon"
    on:click={() => notifications.remove(notification.id, notification.type)}>
    {#if notification.type === 'pending'}
      <div class="progress-tooltip">
        <div class="progress-tooltip-inner">
          You will be notified when this transaction is completed
        </div>
      </div>
    {/if}
  </span>
  <div class="bn-notification-info">
    <p>{notification.message}</p>
    <p class="bn-notification-meta">
      <span class="bn-timestamp">{notificationTime}</span>
      {#if notification.type === 'pending' && notification.startTime}
        <span class="bn-duration">
          -
          <i class="bn-clock" />
          <span class="bn-duration-time">
            {timeString(currentTime - notification.startTime)}
          </span>
        </span>
      {/if}
    </p>
  </div>
</li>
