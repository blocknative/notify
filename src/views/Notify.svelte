<script lang="ts">
  import { onDestroy } from "svelte";
  import { fly } from "svelte/transition";
  import { quintIn } from "svelte/easing";
  import { flip } from "svelte/animate";
  import debounce from "lodash.debounce";

  import CloseIcon from "../components/CloseIcon.svelte";
  import NotificationContent from "../components/NotificationContent.svelte";
  import TypeIcon from "../components/TypeIcon.svelte";
  import AutoDismiss from "../components/AutoDismiss.svelte";
  import { notifications, app } from "../stores";
  import { formatTime } from "../utilities";

  let smallScreen: boolean = window.outerWidth < 450;

  let positioning: string;
  let x: number;
  let y: number;
  let notificationMargin: string;
  let justifyContent: string;

  interface AppStore {
    version: string;
    dappId: string;
    networkId: number;
    nodeSynced: boolean;
    mobilePosition: string;
    desktopPosition: string;
    darkMode: boolean;
    txApproveReminderTimeout: number;
    txStallPendingTimeout: number;
    txStallConfirmedTimeout: number;
  }

  let appState: AppStore = {
    version: "",
    dappId: "",
    networkId: 1,
    nodeSynced: true,
    mobilePosition: "top",
    desktopPosition: "bottomRight",
    darkMode: false,
    txApproveReminderTimeout: 20000,
    txStallPendingTimeout: 20000,
    txStallConfirmedTimeout: 90000
  };

  const unsubscribe = app.subscribe((store: AppStore) => (appState = store));

  // listen for screen resize events
  window.addEventListener(
    "resize",
    debounce(() => {
      if (window.outerWidth < 450) {
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

  let currentTime: number = Date.now();

  const intervalId: number = setInterval(() => {
    currentTime = Date.now();
  }, 1000);

  onDestroy(() => {
    clearInterval(intervalId);
    unsubscribe();
  });

  const formattedTime: string = formatTime(currentTime);

  function elasticOut(t: number): number {
    return (
      Math.sin((-13.0 * (t + 1.0) * Math.PI) / 2) * Math.pow(2.0, -35.0 * t) +
      1.0
    );
  }

  $: if (appState.desktopPosition && !smallScreen) {
    positioning =
      appState.desktopPosition === "bottomRight"
        ? "bottom: 0; right: 0;"
        : appState.desktopPosition === "bottomLeft"
        ? "left: 0; right: unset;"
        : appState.desktopPosition === "topRight"
        ? "top: 0;"
        : "top: 0; bottom: unset; left: 0; right: unset;";

    x = positioning && positioning.includes("left") ? -321 : 321;
    y = 0;

    if (appState.desktopPosition.includes("top")) {
      justifyContent = "justify-content: unset;";
      notificationMargin = "margin: 0.75rem 0 0 0;";
    } else {
      justifyContent = "justify-content: flex-end;";
      notificationMargin = "margin: 0 0 0.75rem 0;";
    }
  }

  $: if (appState.mobilePosition && smallScreen) {
    positioning =
      appState.mobilePosition === "top"
        ? "top: 0; bottom: unset;"
        : "bottom: 0; top: unset;";

    x = 0;

    if (appState.mobilePosition === "top") {
      y = -50;
      justifyContent = "justify-content: unset;";
      notificationMargin = "margin: 0.75rem 0 0 0;";
    } else {
      y = 50;
      justifyContent = "justify-content: flex-end;";
      notificationMargin = "margin: 0 0 0.75rem 0;";
    }
  }

  $: if (!appState.desktopPosition && !appState.mobilePosition) {
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
    background: rgba(40, 57, 68, 0.9);
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
    background: #ffffff;
    backdrop-filter: blur(5px);
    background: rgba(255, 255, 255, 0.9);
  }

  /* .bn-notify-notification-close */
  div {
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
        class:bn-notify-dark-mode={$app.darkMode}
        class:bn-notify-clickable={notification.onclick}
        class="bn-notify-custom bn-notify-notification"
        in:fly={{ duration: 1200, delay: 300, x, y, easing: elasticOut }}
        out:fly={{ duration: 400, x, y, easing: quintIn }}>
        <TypeIcon type={notification.type} />
        <NotificationContent {notification} {formattedTime} {currentTime} />
        <div
          class="bn-notify-custom bn-notify-notification-close"
          on:click={() => notifications.remove(notification.id)}>
          <CloseIcon />
        </div>
        <AutoDismiss {notification} />
      </li>
    {/each}
  </ul>
{/if}
