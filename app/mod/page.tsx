import { permanentRedirect } from 'next/navigation';

export default function ModRedirectPage() {
  permanentRedirect('/install');
}
