
"""HandiHive demo seed data with product and material images."""

from . import models


# Product photographs
PRODUCT_IMAGES = {
    "Amigurumi Bunny": "https://images.unsplash.com/photo-1753370241593-9cc8c17d7434?auto=format&fit=crop&w=900&q=80",
    "Granny Square Tote": "https://images.unsplash.com/photo-1782576417426-4ae01da20440?auto=format&fit=crop&w=900&q=80",
    "Pearl Charm Bracelet": "https://images.unsplash.com/photo-1638332746391-a544ded83aa0?auto=format&fit=crop&w=900&q=80",
    "Clay Flower Earrings": "https://images.unsplash.com/photo-1707222611285-9c67a454f6ed?auto=format&fit=crop&w=900&q=80",
    "Pipe-Cleaner Bouquet": "https://images.unsplash.com/photo-1775784517789-73cd9a881caa?auto=format&fit=crop&w=900&q=80",
    "Floral Hoop Embroidery": "https://images.unsplash.com/photo-1771409046903-1ffb0f45cda9?auto=format&fit=crop&w=900&q=80",
    "Watercolour Pet Portrait": "https://images.unsplash.com/photo-1741037306855-9165f043127c?auto=format&fit=crop&w=900&q=80",
    "Name Keychain Set": "https://images.unsplash.com/photo-1741980983723-09c2051e8b1e?auto=format&fit=crop&w=900&q=80",
}


# Craft material photographs
MATERIAL_IMAGES = {
    "Cotton Yarn 100g": "https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?auto=format&fit=crop&w=900&q=80",
    "Glass Pearl Beads (200 pcs)": "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=80",
    "Pipe Cleaners (100 pcs)": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80",
    "Embroidery Thread Set": "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80",
    "Polymer Clay Pack": "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=900&q=80",
    "Watercolour Paper A4": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80",
    "Crochet Hook Set": "https://images.unsplash.com/photo-1581622558667-4f9b5f3c9e2d?auto=format&fit=crop&w=900&q=80",
}


def seed(db):

    # Update images for existing database records
    if db.query(models.Creator).count():

        products = db.query(models.Product).all()

        for product in products:
            if product.name in PRODUCT_IMAGES:
                product.image = PRODUCT_IMAGES[product.name]

        materials = db.query(models.Material).all()

        for material in materials:
            if material.name in MATERIAL_IMAGES:
                material.image = MATERIAL_IMAGES[material.name]

        db.commit()
        return

    # Create sample creators
    creators = [
        models.Creator(
            name="Meera Knots",
            specialty="Crochet",
            location="Hyderabad",
            bio="Crochet toys and wearables, one stitch at a time."
        ),
        models.Creator(
            name="Zara Beads",
            specialty="Bracelets & Jewellery",
            location="Pune",
            bio="Beaded bracelets and clay jewellery in pastel palettes."
        ),
        models.Creator(
            name="Ishaan Arts",
            specialty="Painting & Gifts",
            location="Jaipur",
            bio="Hand-painted keepsakes and personalised gifts."
        )
    ]

    db.add_all(creators)
    db.flush()

    c = creators
    P = models.Product

    # Create products
    db.add_all([

        P(
            name="Amigurumi Bunny",
            category="Crochet",
            price=650,
            material="Cotton yarn",
            colour="Lavender",
            description="A soft crocheted bunny stuffed with hypoallergenic fibre.",
            image=PRODUCT_IMAGES["Amigurumi Bunny"],
            creator_id=c[0].id
        ),

        P(
            name="Granny Square Tote",
            category="Crochet",
            price=900,
            material="Cotton yarn",
            colour="Pastel mix",
            description="Roomy tote made from joined granny squares.",
            image=PRODUCT_IMAGES["Granny Square Tote"],
            creator_id=c[0].id
        ),

        P(
            name="Pearl Charm Bracelet",
            category="Bracelets",
            price=350,
            material="Glass pearls",
            colour="Pink",
            description="Stretch bracelet with tiny pearl charms.",
            image=PRODUCT_IMAGES["Pearl Charm Bracelet"],
            creator_id=c[1].id
        ),

        P(
            name="Clay Flower Earrings",
            category="Jewellery",
            price=280,
            material="Polymer clay",
            colour="Cream",
            description="Lightweight hand-moulded flower studs.",
            image=PRODUCT_IMAGES["Clay Flower Earrings"],
            creator_id=c[1].id
        ),

        P(
            name="Pipe-Cleaner Bouquet",
            category="Pipe-cleaner crafts",
            price=450,
            material="Pipe cleaners",
            colour="Mixed",
            description="A bouquet that never wilts.",
            image=PRODUCT_IMAGES["Pipe-Cleaner Bouquet"],
            creator_id=c[1].id
        ),

        P(
            name="Floral Hoop Embroidery",
            category="Embroidery",
            price=750,
            material="Cotton thread",
            colour="Cream & pink",
            description="Hand-embroidered wildflowers in a 6-inch hoop.",
            image=PRODUCT_IMAGES["Floral Hoop Embroidery"],
            creator_id=c[2].id
        ),

        P(
            name="Watercolour Pet Portrait",
            category="Painting",
            price=1200,
            material="Watercolour paper",
            colour="Custom",
            description="A painted portrait from your pet's photo.",
            image=PRODUCT_IMAGES["Watercolour Pet Portrait"],
            creator_id=c[2].id
        ),

        P(
            name="Name Keychain Set",
            category="Personalized gifts",
            price=320,
            material="Acrylic & beads",
            colour="Custom",
            description="Personalised name keychains.",
            image=PRODUCT_IMAGES["Name Keychain Set"],
            creator_id=c[2].id
        )

    ])

    # Create craft materials
    M = models.Material

    db.add_all([

        M(
            name="Cotton Yarn 100g",
            category="Yarn",
            price=120,
            description="Soft mercerised cotton, 20 colours.",
            image=MATERIAL_IMAGES["Cotton Yarn 100g"]
        ),

        M(
            name="Glass Pearl Beads (200 pcs)",
            category="Beads",
            price=180,
            description="6mm pearl beads for bracelets.",
            image=MATERIAL_IMAGES["Glass Pearl Beads (200 pcs)"]
        ),

        M(
            name="Pipe Cleaners (100 pcs)",
            category="Pipe cleaners",
            price=90,
            description="Fluffy assorted colours.",
            image=MATERIAL_IMAGES["Pipe Cleaners (100 pcs)"]
        ),

        M(
            name="Embroidery Thread Set",
            category="Thread",
            price=210,
            description="50 skeins of stranded cotton.",
            image=MATERIAL_IMAGES["Embroidery Thread Set"]
        ),

        M(
            name="Polymer Clay Pack",
            category="Clay",
            price=260,
            description="12 pastel blocks, oven-bake.",
            image=MATERIAL_IMAGES["Polymer Clay Pack"]
        ),

        M(
            name="Watercolour Paper A4",
            category="Paint & paper",
            price=150,
            description="Cold-press, 300gsm, 20 sheets.",
            image=MATERIAL_IMAGES["Watercolour Paper A4"]
        ),

        M(
            name="Crochet Hook Set",
            category="Tools",
            price=240,
            description="Ergonomic hooks 2mm-6mm.",
            image=MATERIAL_IMAGES["Crochet Hook Set"]
        )

    ])

    db.commit()
