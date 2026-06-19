import Image from "next/image";
import { DotField } from "./dot-field";
import LoginForm from "@/widget/form/login-form/login-form";
import { ArrowRight, LockKeyhole, Wheat } from "lucide-react";

export const LoginPage = () => {
  return (
    <main className="min-h-svh overflow-hidden bg-white text-[#223137]">
      <div className="grid min-h-svh lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-[#1c302c] px-10 py-9 text-white lg:flex lg:flex-col lg:justify-between">
          <DotField className="absolute inset-0" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(28,48,44,0.16),rgba(28,48,44,0.34))]" />
          <div className="absolute left-0 top-0 h-full w-1.5 bg-[#f38810]" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-md bg-white shadow-xl shadow-black/20">
              <Image src="/logo.svg" alt="SUNGRAIN" width={32} height={31} />
            </div>
            <div>
              <p className="text-lg font-semibold leading-5">SUNGRAIN</p>
              <p className="text-xs uppercase text-[#b8c7bd]">
                Grain logistics CRM
              </p>
            </div>
          </div>

          <div className="relative z-10 max-w-[760px]">
            <div className="mb-6 flex w-fit items-center gap-2 rounded-md border border-white/12 bg-white/8 px-3 py-2 text-sm text-[#dce5de]">
              <Wheat className="size-4 text-[#f38810]" />
              Рабочий кабинет команды
            </div>
            <h1 className="whitespace-nowrap text-[clamp(3rem,5vw,4rem)] font-semibold leading-[1.02] tracking-normal">
              Вход в SUNGRAIN CRM
            </h1>
            <p className="mt-6 max-w-[520px] text-base leading-7 text-[#d0ddd4]">
              Единая система для контрактов, логистики и документооборота.
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/12 pt-5 text-sm text-[#cdd8cf]">
            <div className="flex items-center gap-2">
              <LockKeyhole className="size-4 text-[#f38810]" />
              Защищенный доступ
            </div>
            <ArrowRight className="size-4 text-[#f38810]" />
          </div>
        </section>

        <section className="relative flex min-h-svh items-center justify-center overflow-hidden bg-white px-5 py-8 sm:px-8 lg:px-12">
          <div className="relative z-10 w-full max-w-[420px]">
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex size-12 items-center justify-center rounded-md bg-white shadow-md shadow-[#20302c]/10">
                <Image src="/logo.svg" alt="SUNGRAIN" width={32} height={31} />
              </div>
              <div>
                <p className="text-lg font-semibold leading-5">SUNGRAIN</p>
                <p className="text-xs uppercase text-[#6f6a5f]">
                  Grain logistics CRM
                </p>
              </div>
            </div>

            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
};
