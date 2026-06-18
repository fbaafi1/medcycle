import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | The MedCycle',
  description: "Learn about The MedCycle's mission to reduce medical waste and improve healthcare access in Ghana by connecting surplus medication donors with clinics in need.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
