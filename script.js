// FAQ accordion
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-answer').style.maxHeight = '0';
    });

    if (!isOpen) {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// Nav background on scroll
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    nav.style.borderBottom = '1px solid rgba(0,0,0,0.08)';
    nav.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
  } else {
    nav.style.borderBottom = 'none';
    nav.style.boxShadow = 'none';
  }
}, { passive: true });

// Animate steps in How it works
const stepItems = document.querySelectorAll('.step-item');
let current = 0;
setInterval(() => {
  stepItems.forEach(s => s.classList.remove('active'));
  current = (current + 1) % stepItems.length;
  stepItems[current].classList.add('active');
}, 2500);
