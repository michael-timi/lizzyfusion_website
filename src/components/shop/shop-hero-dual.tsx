import Link from "next/link";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { getMergedCatalog } from "@/lib/catalog";
import { resolveTileProduct } from "@/lib/site-featured";
import { getSiteFeatured } from "@/lib/site-featured-server";
import { landingMedia } from "@/lib/site";

/** Full-bleed dual lifestyle strip (Shop all reference). Each panel opens its representative PDP. */
export async function ShopHeroDual() {
  const [catalog, featured] = await Promise.all([getMergedCatalog(), getSiteFeatured()]);
  const [left, right] = landingMedia.collectionTiles;
  const leftHref = resolveTileProduct(featured, catalog, left).href;
  const rightHref = resolveTileProduct(featured, catalog, right).href;

  return (
    <div className="grid grid-cols-2 gap-0">
      <Link href={leftHref} className="group/hero relative block aspect-[3/2] min-h-[14rem] sm:min-h-[18rem] lg:min-h-[22rem]">
        <LfRemoteImage
          src={left.image}
          alt={left.label}
          fill
          className="object-cover transition duration-500 group-hover/hero:scale-[1.02]"
          sizes="50vw"
          priority
        />
      </Link>
      <Link href={rightHref} className="group/hero relative block aspect-[3/2] min-h-[14rem] sm:min-h-[18rem] lg:min-h-[22rem]">
        <LfRemoteImage
          src={right.image}
          alt={right.label}
          fill
          className="object-cover transition duration-500 group-hover/hero:scale-[1.02]"
          sizes="50vw"
          priority
        />
      </Link>
    </div>
  );
}
