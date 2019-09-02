<script>
  import { fade } from "svelte/transition";
  import Notification from "./Notification.svelte";
  import { notifications, app } from "../stores";
</script>

<style>
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
  }

  ::-webkit-scrollbar {
    display: none;
  }
</style>

{#if $notifications.length > 0}
  <ul class="bn-notify-notifications">
    {#each $notifications as notification}
      <Notification {notification} />
    {/each}
  </ul>
{/if}
