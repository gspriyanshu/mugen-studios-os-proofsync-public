(() => {
  const inputs = [...document.querySelectorAll('input[type="radio"]')];
  const score = document.querySelector('[data-score]');
  const answered = document.querySelector('[data-answered]');
  const status = document.querySelector('[data-status]');
  function update() {
    const names = [...new Set(inputs.map(input => input.name))];
    const chosen = names.map(name => document.querySelector('input[name="' + name + '"]:checked')).filter(Boolean);
    const points = chosen.reduce((sum, input) => sum + Number(input.value), 0);
    const percent = Math.round((points / (names.length * 2)) * 100);
    score.textContent = String(percent);
    answered.textContent = chosen.length + ' of ' + names.length + ' answered';
    status.textContent = chosen.length < names.length ? 'Complete every question for a useful readiness view.' : percent >= 80 ? 'Strong implementation readiness. Validate every real-clinic fact before release.' : percent >= 55 ? 'Foundation present. Resolve evidence and governance gaps before expansion.' : 'Material readiness gaps remain. Prioritize truth, eligibility and ownership before content volume.';
  }
  inputs.forEach(input => input.addEventListener('change', update));
  document.querySelector('[data-print]').addEventListener('click', () => window.print());
  document.querySelector('[data-reset]').addEventListener('click', () => { inputs.forEach(input => { input.checked = false; }); update(); });
  update();
})();
