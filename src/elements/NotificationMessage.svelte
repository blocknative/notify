<script lang="ts">
  export let message: string
</script>

<style>
  /* .bn-notify-notification-info-message */
  p {
    margin: 0;
    font-family: inherit;
    font-size: inherit;
  }
</style>

<p class="bn-notify-custom bn-notify-notification-info-message">
  {@html message}
</p>
