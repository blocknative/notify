<script>
  import { fade } from "svelte/transition";
  import debounce from "lodash.debounce";
  import Notification from "./Notification.svelte";
  import { notifications, app } from "../stores";

  let smallScreen = window.innerWidth < 850;

  // listen for screen resize events
  window.addEventListener(
    "resize",
    debounce(() => {
      if (window.innerWidth < 850) {
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
</script>

<style>
  /* .bn-notify-notifications */
  ul {
    display: flex;
    flex-flow: column nowrap;
    position: fixed;
    padding: 0.75rem;
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
  }

  :global(.bn-notify-custom.bn-notify-dark-mode) {
    background: #283944;
    color: #ffffff;
  }

  ::-webkit-scrollbar {
    display: none;
  }
</style>

{#if $notifications.length > 0}
  <ul class="bn-notify-custom bn-notify-notifications">
    {#each $notifications as notification, i (notification.key)}
      <Notification {notification} {smallScreen} />
    {/each}
  </ul>
{/if}
