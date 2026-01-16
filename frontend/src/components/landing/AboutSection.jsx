import { Cpu, Zap } from 'lucide-react'

export default function AboutSection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">Tamper-Resistant Attendance Verification</h2>
                <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
                    <div className="relative space-y-4">
                        <p className="text-muted-foreground">
                            Our advanced system uses <span className="text-accent-foreground font-bold">multi-factor biometric authentication</span> to eliminate proxy attendance and ensure academic integrity.
                        </p>
                        <p className="text-muted-foreground">Combining facial recognition with ID validation, fingerprint authentication, and behavioral verification provides comprehensive protection against spoofing attempts.</p>

                        <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-4" />
                                    <h3 className="text-sm font-medium">Real-time Detection</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">Instant liveness detection and body posture analysis using MoveNet prevents fraudulent attempts.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Cpu className="size-4" />
                                    <h3 className="text-sm font-medium">Secure Storage</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">Attendance records stored with encryption and comprehensive audit trails for compliance.</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative mt-6 sm:mt-0">
                        <div
                            className="bg-linear-to-b aspect-67/34 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700">
                            <img
                                src="/exercice-dark.png"
                                className="hidden rounded-[15px] dark:block"
                                alt="payments illustration dark"
                                width={1206}
                                height={612} />
                            <img
                                src="/exercice.png"
                                className="rounded-[15px] shadow dark:hidden"
                                alt="payments illustration light"
                                width={1206}
                                height={612} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
