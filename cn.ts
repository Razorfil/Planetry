@import "tailwindcss";

* {
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}

*::-webkit-scrollbar {
  width: 6px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background-color: #334155;
  border-radius: 6px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.35s ease-out;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(56, 189, 248, 0.1);
  }
  50% {
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

html, body, #root {
  height: 100%;
  margin: 0;
  background: #020617;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  opacity: 0.5;
}
