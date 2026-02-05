<style scoped>
  .card {
    /* color used to softly clip top and bottom of the .words container */
    /* --bg-color: #111; */
    /* background-color: var(--bg-color); */
    padding: 1rem 2rem;
    border-radius: 1.25rem;
  }
  .loader {
    color: rgb(124, 124, 124);
    font-family: "Poppins", sans-serif;
    font-weight: 500;
    font-size: 25px;
    -webkit-box-sizing: content-box;
    box-sizing: content-box;
    height: 40px;
    padding: 10px 10px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    border-radius: 8px;
  }

  .loader p {
    margin: 0;
    padding: 0;
    /* color: #956afa; */
    /* color: #fff; */
    font-weight: 600;
    font-size: 25px;
    /* line-height: 40px; */
  }

  .words {
    overflow: hidden;
    position: relative;
  }
  .words::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      var(--bg-color) 10%,
      transparent 30%,
      transparent 70%,
      var(--bg-color) 90%
    );
    z-index: 20;
  }

  .word {
    display: block;
    height: 100%;
    padding-left: 6px;
    color: var(--gh-primary-blue);
    animation: spin_4991 4s infinite;
  }

  @keyframes spin_4991 {
    10% {
      -webkit-transform: translateY(-102%);
      transform: translateY(-102%);
    }

    25% {
      -webkit-transform: translateY(-100%);
      transform: translateY(-100%);
    }

    35% {
      -webkit-transform: translateY(-202%);
      transform: translateY(-202%);
    }

    50% {
      -webkit-transform: translateY(-200%);
      transform: translateY(-200%);
    }

    60% {
      -webkit-transform: translateY(-302%);
      transform: translateY(-302%);
    }

    75% {
      -webkit-transform: translateY(-300%);
      transform: translateY(-300%);
    }

    85% {
      -webkit-transform: translateY(-402%);
      transform: translateY(-402%);
    }

    100% {
      -webkit-transform: translateY(-400%);
      transform: translateY(-400%);
    }
  }
</style>

<script setup>
/**
 * Loading Component
 * This component displays a loading animation with rotating words.
 */
// const words = ref(['buttons', 'forms', 'switches', 'cards', 'buttons']);

defineProps({
  // Define any props if needed in the future
  words: {
    type: Array,
    default: () => ['buttons', 'forms', 'switches', 'cards', 'buttons']
  }
});

</script>
<template>
  <div class="card">
    <div class="loader">
      <p>loading</p>
      <div class="words">
        <span v-for="word in words" class="word">{{ word }}</span>
      </div>
    </div>
  </div>
</template>
