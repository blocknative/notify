<script>
  import { onDestroy } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { quintIn } from "svelte/easing";
  import { flip } from "svelte/animate";
  import debounce from "lodash.debounce";

  import CloseIcon from "../components/CloseIcon.svelte";
  import AutoDismiss from "../components/AutoDismiss.svelte";
  import { notifications, app, configuration } from "../stores";
  import { timeString, formatTime } from "../utilities";

  let smallScreen = window.innerWidth < 420;

  let positioning;
  let x;
  let y;
  let notificationMargin;
  let justifyContent;

  // listen for screen resize events
  window.addEventListener(
    "resize",
    debounce(() => {
      if (window.innerWidth < 420) {
        if (!smallScreen) {
          smallScreen = true;
        }
      } else {
        if (smallScreen) {
          smallScreen = false;
        }
      }
    }, 300)
  );

  let currentTime = Date.now();

  const intervalId = setInterval(() => {
    currentTime = Date.now();
  }, 1000);

  onDestroy(() => clearInterval(intervalId));

  const formattedTime = formatTime(currentTime);

  const icons = {
    hint: "/icons/icon-info-animated.svg",
    pending: "/icons/icon-clock-animated.svg",
    success: "/icons/icon-check-animated.svg",
    error: "/icons/icon-alert-animated.svg"
  };

  function elasticOut(t) {
    return (
      Math.sin((-13.0 * (t + 1.0) * Math.PI) / 2) * Math.pow(2.0, -35.0 * t) +
      1.0
    );
  }

  $: if ($configuration.desktopPosition && !smallScreen) {
    positioning =
      $configuration.desktopPosition === "bottomRight"
        ? "bottom: 0; right: 0;"
        : $configuration.desktopPosition === "bottomLeft"
        ? "left: 0; right: unset;"
        : $configuration.desktopPosition === "topRight"
        ? "top: 0;"
        : "top: 0; bottom: unset; left: 0; right: unset;";

    x = positioning && positioning.includes("left") ? -321 : 321;
    y = 0;

    if ($configuration.desktopPosition.includes("top")) {
      justifyContent = "justify-content: unset;";
      notificationMargin = "margin: 0.75rem 0 0 0;";
    } else {
      justifyContent = "justify-content: flex-end;";
      notificationMargin = "margin: 0 0 0.75rem 0;";
    }
  }

  $: if ($configuration.mobilePosition && smallScreen) {
    positioning =
      $configuration.mobilePosition === "top"
        ? "top: 0; bottom: unset;"
        : "bottom: 0; top: unset;";

    x = 0;

    if ($configuration.mobilePosition === "top") {
      y = -50;
      justifyContent = "justify-content: unset;";
      notificationMargin = "margin: 0.75rem 0 0 0;";
    } else {
      y = 50;
      justifyContent = "justify-content: flex-end;";
      notificationMargin = "margin: 0 0 0.75rem 0;";
    }
  }

  $: if (!$configuration.desktopPosition && !$configuration.mobilePosition) {
    x = smallScreen ? 0 : 321;
    y = smallScreen ? 50 : 0;
    notificationMargin = "margin: 0 0 0.75rem 0;";
    justifyContent = "justify-content: flex-end;";
    positioning = "bottom: 0; right: 0;";
  }
</script>

<style>
  /* .bn-notify-notifications */
  ul {
    display: flex;
    flex-flow: column nowrap;
    position: fixed;
    padding: 0 0.75rem;
    margin: 0;
    list-style-type: none;
    width: 20rem;
    bottom: 0;
    right: 0;
    font-family: "Helvetica Neue";
    max-height: 100vh;
    overflow-y: scroll;
    overflow-x: hidden;
    color: #4a4a4a;
    background: transparent;
    scrollbar-width: none;
    box-sizing: border-box;
    height: 100vh;
    pointer-events: none;
    z-index: 9;
  }

  @media only screen and (max-width: 450px) {
    ul {
      width: 100%;
    }
  }

  :global(.bn-notify-custom.bn-notify-dark-mode) {
    background: #283944;
    color: #ffffff;
  }

  :global(.bn-notify-clickable:hover) {
    cursor: pointer;
  }

  ::-webkit-scrollbar {
    display: none;
  }

  /* .bn-notify-notification */
  li {
    position: relative;
    display: flex;
    padding: 0.75rem;
    font-size: 0.889rem;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
    color: inherit;
    transition: background 300ms ease-in-out, color 300ms ease-in-out;
    pointer-events: all;
  }

  /* .bn-notify-notification-status-icon */
  div:nth-child(1) {
    height: 100%;
    width: 1.5rem;
  }

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
  }

  /* .bn-notify-notification-info-meta */
  div:nth-child(2) p:nth-child(2) {
    margin: 0.75rem 0 0 0;
    opacity: 0.7;
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

  /* .bn-notify-notification-close */
  div:nth-child(3) {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
  }
</style>

{#if $notifications.length > 0}
  <ul
    class="bn-notify-custom bn-notify-notifications"
    style={`${positioning} ${justifyContent}`}>
    {#each $notifications as notification, i (notification.key)}
      <li
        on:click={notification.onclick}
        style={notificationMargin}
        animate:flip={{ duration: 500 }}
        class:bn-notify-dark-mode={$configuration.darkMode}
        class:bn-notify-clickable={notification.onclick}
        class="bn-notify-custom bn-notify-notification"
        in:fly={{ duration: 1200, delay: 300, x, y, easing: elasticOut }}
        out:fly={{ duration: 400, x, y, easing: quintIn }}>
        <div class="bn-notify-custom bn-notify-notification-status-icon">
          <img src={icons[notification.type]} alt="status" />
        </div>
        <div class="bn-notify-custom bn-notify-notification-info">
          <p>{notification.message}</p>
          <p class="bn-notify-custom bn-notify-notification-info-meta">
            <span
              class="bn-notify-custom bn-notify-notification-info-meta-timestamp">
              {formattedTime}
            </span>
            {#if notification.type === 'pending' && notification.startTime}
              <span
                class="bn-notify-custom
                bn-notify-notification-info-meta-duration">
                -
                <i
                  class="bn-notify-custom bn-notify-notification-info-meta-clock" />
                <span
                  class="bn-notify-custom
                  bn-notify-notification-info-meta-duration-time">
                  {timeString(currentTime - notification.startTime)}
                </span>
              </span>
            {/if}
          </p>
        </div>
        <div
          class="bn-notify-custom bn-notify-notification-close"
          on:click={() => notifications.remove(notification)}>
          <CloseIcon />
        </div>
        <AutoDismiss {notification} />
      </li>
    {/each}
  </ul>
{/if}
