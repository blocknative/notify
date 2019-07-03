<script>
  import { notifications, app } from "./stores";
  import Notification from "./Notification.svelte";
  import { fade } from "svelte/transition";
</script>

<style>
  #blocknative-notifications {
    display: flex;
    flex-flow: column nowrap;
    position: fixed;
    padding: 10px;
    width: 371px;
    bottom: 0;
    right: 0;
  }

  ::-webkit-scrollbar {
    display: none;
  }

  .bn-notifications {
    display: flex;
    flex-flow: column nowrap;
    list-style-type: none;
    width: 100%;
  }
</style>

{#if $notifications.length > 0}
  <div id="blocknative-notifications" transition:fade={{ duration: 150 }}>
    <div class="bn-notifications-scroll">
      <ul class="bn-notifications">
        {#each $notifications as notification, i (notification.id)}
          <Notification {notification} />
        {/each}
      </ul>
    </div>
  </div>
{/if}

{#if $app.watchedAccounts && $app.watchedAccounts.length > 0}
  <div>
    <h2>Watched Addresses</h2>
    <ul>
      {#each $app.watchedAccounts as account, i (account)}
        <li>{account}</li>
      {/each}
    </ul>
  </div>
{/if}
