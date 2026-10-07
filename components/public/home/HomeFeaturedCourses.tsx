import Link from "next/link";
import HomeCourseCard from "./HomeCourseCard";
import { getHomeCourses } from "@/lib/public-courses";
import styles from "./HomeLanding.module.css";

export default async function HomeFeaturedCourses() {
  const courses = await getHomeCourses(8);
  return <section id="formations" className={styles.courses} aria-labelledby="home-featured-courses-title"><div className={styles.container}>
    <div className={styles.sectionHeading}><div><p className={styles.kicker}>INVESTISSEZ DANS VOS COMPÉTENCES</p><h2 id="home-featured-courses-title">Votre prochaine étape<br />commence ici.</h2></div><Link href="/formations" className={styles.catalogueLink}>Toutes les formations <span aria-hidden="true">↗</span></Link></div>
    {courses.length ? <div className={styles.courseGrid}>{courses.map(course => <HomeCourseCard key={course.id} course={course} />)}</div> : <div className={styles.empty}><strong>Les formations arrivent bientôt</strong><p>Retrouvez prochainement les formations disponibles dans notre catalogue.</p></div>}
  </div></section>;
}
