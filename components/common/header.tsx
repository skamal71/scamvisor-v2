import NavLink from "./navlink";
import { cookies } from "next/headers";

export default async function Header() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const isAuthenticated = !!token;

  return (
    <nav className="container flex items-center justify-between py-2 lg:px-8 px-2 mx-auto">
      <div className="flex lg:justify-start lg:flex-1 text-2xl font-semibold font-lexend">
        {}
      </div>
    </nav>
  );
}
