document.addEventListener('DOMContentLoaded', function() {
  const helloworld = document.getElementById('helloworld');
  let isRed = false;

  helloworld.addEventListener('click', function() {
    if (isRed) {
      helloworld.style.color = 'black';
      isRed = false;
    } else {
      helloworld.style.color = 'red';
      isRed = true;
    }
  });
});
