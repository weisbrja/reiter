import { useState } from 'preact/hooks'
import { usePopupErrorContext } from '../components/Popup'

export default function AddCrawlerForm({ onSubmit }: { onSubmit: (crawler: string) => void }) {
    const { setError, onCancel } = usePopupErrorContext()
    const [crawler, setCrawler] = useState<string>('')

    function handleSubmit(e: Event) {
        e.preventDefault()
        if (!crawler) {
            setError('Crawler required.')
            return
        }
        onSubmit(crawler)
    }
    return (
        <form>
            <div class="form-control mb-4">
                <div class="label">
                    <label class="label-text">Ref_ID</label>
                </div>
                <input
                    type="text"
                    id="crawler"
                    value={crawler}
                    onInput={(e) => setCrawler((e.target as HTMLInputElement).value)}
                    class="input input-bordered"
                    placeholder="Enter your password"
                />
                <div class="label">
                    <label class="label-text">Crawler</label>
                </div>
                <select class="select select-bordered">
                    <option>kit-ilias-web</option>
                    <option>ilias-web</option>
                    <option>kit-ipd</option>
                    <option>local</option>
                </select>
            </div>
            <div class="flex justify-end">
                <button type="button" onClick={onCancel} class="btn btn-error mr-4">
                    Cancel
                </button>
                <button type="submit" class="btn btn-primary" onClick={handleSubmit}>
                    Add Crawler
                </button>
            </div>
        </form>
    )
}
