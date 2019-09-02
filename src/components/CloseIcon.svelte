<script>
  let hovered;
</script>

<style>
  /* .bn-notify-notification-close-icon */
  div {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.2rem;
    border-radius: 40px;
    transition: background 150ms ease-in-out;
  }

  div:hover {
    background: #eeeeee;
  }
</style>

<div
  class="bn-notify-custom bn-notify-notification-close-icon"
  on:mouseenter={() => (hovered = true)}
  on:mouseleave={() => (hovered = false)}>
  <svg
    height="12"
    viewBox="0 0 12 12"
    width="12"
    xmlns="http://www.w3.org/2000/svg">
    <g
      fill="none"
      stroke={hovered ? '#4a4a4a' : '#9B9B9B'}
      stroke-linecap="square"
      stroke-width="2"
      transform="translate(2 2)">
      <path d="m.1.1 7.82304289 7.82304289" />
      <path d="m.1.1 7.82304289 7.82304289" transform="matrix(-1 0 0 1 8 0)" />
    </g>
  </svg>
</div>
