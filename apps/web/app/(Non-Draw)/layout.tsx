import Footer from "../_components/Footer";
import Header from "../_components/Header";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Header />
      {children}
      <Footer/>
    </div>
  );
}
