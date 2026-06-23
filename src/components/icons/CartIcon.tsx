export default function CartIcon({ className }: { className?: string }) {
  return (
    <svg width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <g clipPath="url(#cart-clip)">
        <path fillRule="evenodd" clipRule="evenodd" d="M27.3569 5.3744C28.2411 5.3744 28.8201 5.66866 29.3992 6.31504C29.9782 6.95978 30.0793 7.88554 29.9502 8.727L28.5742 17.9284C28.3143 19.6973 26.7483 21 24.9083 21H9.10071C7.17358 21 5.57956 19.57 5.42086 17.7185L3.82336 3.78572C3.7972 3.55758 3.61583 3.37244 3.3769 3.33276L1.89973 3.08643C1.31897 2.9889 0.914365 2.44171 1.01552 1.87963C1.11667 1.30599 1.68173 0.927418 2.27643 1.01173L5.7313 1.51594C6.2231 1.6019 6.58586 1.99205 6.62946 2.46982L6.90501 4.5875C6.9486 5.03715 7.32532 5.3744 7.78921 5.3744H27.3569Z" stroke="currentColor" strokeWidth="1.5"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M9.98588 24.4832C8.54121 24.4832 7.37097 25.6872 7.37097 27.1763C7.37097 28.6655 8.54121 29.852 9.98588 29.852C11.4305 29.852 12.5835 28.6481 12.5835 27.1763C12.5835 25.7045 11.4133 24.4832 9.98588 24.4832Z" stroke="currentColor" strokeWidth="1.5"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M24.1359 24.4832C22.6896 24.4832 21.521 25.6872 21.521 27.1763C21.521 28.6655 22.6913 29.852 24.1359 29.852C25.5806 29.852 26.7336 28.6481 26.7336 27.1763C26.7336 25.7045 25.5634 24.4832 24.1359 24.4832Z" stroke="currentColor" strokeWidth="1.5"/>
      </g>
      <defs>
        <clipPath id="cart-clip">
          <rect width="31" height="31" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  )
}
