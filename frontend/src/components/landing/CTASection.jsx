import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function CTASection() {
    return (
        <section className="py-20">
            <div
                className="mx-auto bg-background max-w-5xl rounded-3xl border px-6 py-12 md:py-20 lg:py-20">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Transform Your Attendance Management</h2>
                    <p className="mt-4">Implement secure, intelligent biometric verification across your institution today.</p>

                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <Button asChild size="lg">
                            <Link href="/">
                                <span>Start Free Trial</span>
                            </Link>
                        </Button>

                        <Button asChild size="lg" variant="outline">
                            <Link href="/">
                                <span>Schedule Demo</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
