import Link from "next/link";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { getMergedCatalog } from "@/lib/catalog";
import { resolveTileMediaList } from "@/lib/site-featured";
import { getSiteFeatured } from "@/lib/site-featured-server";
import { landingMedia } from "@/lib/site";

/** Full-bleed dual lifestyle strip (Shop all reference). Each panel opens its representative PDP. */
export async function ShopHeroDual() {
  const [catalog, featured] = await Promise.all([getMergedCatalog(), getSiteFeatured()]);
  const [left, right] = landingMedia.collectionTiles;
  const [leftMedia, rightMedia] = resolveTileMediaList(featured, catalog, [left, right]);

  return (
    <div className="grid grid-cols-2 gap-0">
      <Link href={leftMedia.href} className="group/hero relative block aspect-3/2 min-h-56 sm:min-h-72 lg:min-h-88">
        <LfRemoteImage
          src={leftMedia.image}
          alt={leftMedia.alt}
          fill
          className="object-cover transition duration-500 group-hover/hero:scale-[1.02]"
          sizes="50vw"
          priority
        />
      </Link>
      <Link href={rightMedia.href} className="group/hero relative block aspect-3/2 min-h-56 sm:min-h-72 lg:min-h-88">
        <LfRemoteImage
          src={rightMedia.image}
          alt={rightMedia.alt}
          fill
          className="object-cover transition duration-500 group-hover/hero:scale-[1.02]"
          sizes="50vw"
          priority
        />
      </Link>
    </div>
  );
}
