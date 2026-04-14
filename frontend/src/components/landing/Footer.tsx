import logo from "../../assets/bytestream-logo.png";

export default function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-3">
          <img src={logo} alt="ByteStream" width={28} height={28} loading="lazy" />
          <span className="font-heading text-lg font-bold text-foreground">
            Byte<span className="text-primary">Stream</span>
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} ByteStream. Built for developers, by developers.
        </p>
      </div>
    </footer>
  );
}